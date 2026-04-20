import React, { useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Menu, Search, Plus, Package, Sprout, MessageSquare,
  Settings, ChevronRight, Pin, MoreHorizontal, X,
  Palette, ChevronDown, Clock, Type, GripVertical, ArrowUp, ArrowDown
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
  const [dragOverChatId, setDragOverChatId] = useState(null);
  const [sortBy, setSortBy] = useState('custom');

  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedChats, setSelectedChats] = useState([]);
  const longPressTimer = useRef(null);

  const handlePointerDown = (id) => {
    if (selectionMode) return;
    longPressTimer.current = setTimeout(() => {
      setSelectionMode(true);
      setSelectedChats([id]);
    }, 500);
  };
  const handlePointerUp = () => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
  };
  const toggleSelect = (e, id) => {
    e.stopPropagation();
    setSelectedChats(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const hasChats = state.conversations.some(c => c.messages.length > 0);

  React.useEffect(() => {
    if (!open) {
      setShowThemePicker(false);
      setSearchOpen(false);
    }
  }, [open]);

  const conversations = state.conversations.filter(c =>
    c.messages.length > 0 &&
    (searchQuery === '' || c.title.toLowerCase().includes(searchQuery.toLowerCase()))
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

  const handleDragOver = (e, targetConv) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (!draggedChat || draggedChat.id === targetConv.id) return;
    if (draggedChat.pinned !== targetConv.pinned) return;

    // Midpoint check to prevent jitter/loops
    const rect = e.currentTarget.getBoundingClientRect();
    const midpoint = rect.top + rect.height / 2;
    const isAbove = e.clientY < midpoint;

    const dragIdx = state.conversations.findIndex(c => c.id === draggedChat.id);
    const hoverIdx = state.conversations.findIndex(c => c.id === targetConv.id);

    if (dragIdx < hoverIdx && isAbove) return;
    if (dragIdx > hoverIdx && !isAbove) return;

    dispatch({ type: 'REORDER_CONVERSATIONS', payload: { draggedId: draggedChat.id, targetId: targetConv.id } });
    setSortBy('custom');
  };

  const handleDragEnd = () => {
    setDraggedChat(null);
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDraggedChat(null);
  };

  const handleSort = (type) => {
    setSortBy(type);
    dispatch({ type: 'SORT_CONVERSATIONS', payload: type });
  };

  const handleSeedClick = (seedId) => {
    dispatch({ type: 'NEW_CONVERSATION', payload: { seedId, force: true } });
    navigate('/chat');
  };

  const handleMove = (e, id, direction) => {
    e.stopPropagation();
    const arr = [...state.conversations];
    const index = arr.findIndex(c => c.id === id);
    if (index < 0) return;
    const targetIndex = index + direction;
    if (targetIndex >= 0 && targetIndex < arr.length) {
      dispatch({ type: 'REORDER_CONVERSATIONS', payload: { draggedId: id, targetId: arr[targetIndex].id } });
    }
    setChatMenuOpen(null);
    setSortBy('custom');
  };

  const renderChatItem = (conv) => {
    const isActive = conv.id === state.activeConversationId;
    return (
      <div
        key={conv.id}
        draggable={!selectionMode}
        onDragStart={(e) => {
          if (selectionMode) return;
          handleDragStart(e, conv);
          if (longPressTimer.current) clearTimeout(longPressTimer.current);
        }}
        onDragOver={(e) => handleDragOver(e, conv)}
        onDragEnter={(e) => e.preventDefault()}
        onDrop={handleDrop}
        onDragEnd={handleDragEnd}
        className={`sidebar-chat-item ${isActive ? 'active' : ''} ${selectionMode && selectedChats.includes(conv.id) ? 'selected' : ''} ${draggedChat?.id === conv.id ? 'dragging' : ''}`}
        onClick={(e) => {
           if (selectionMode) {
             toggleSelect(e, conv.id);
             return;
           }
           handleSelectChat(conv.id);
        }}
        onPointerDown={() => handlePointerDown(conv.id)}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        onMouseEnter={() => setHoveredChat(conv.id)}
        onMouseLeave={() => { setHoveredChat(null); if (chatMenuOpen === conv.id) setChatMenuOpen(null); }}
      >
        {selectionMode && (
           <input 
             type="checkbox" 
             className="chat-checkbox" 
             checked={selectedChats.includes(conv.id)}
             readOnly
           />
        )}
        {!selectionMode && (
          <div className="chat-drag-handle" style={{ opacity: 0.5, cursor: 'grab', marginRight: '6px', display: 'flex', alignItems: 'center' }}>
            <GripVertical size={13} />
          </div>
        )}
        {!selectionMode && <MessageSquare size={13} className="chat-icon" />}

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
        {!renamingId && !selectionMode && (
          <div className="chat-item-actions" onClick={e => { e.stopPropagation(); setChatMenuOpen(chatMenuOpen === conv.id ? null : conv.id); }}>
            <MoreHorizontal size={14} />
          </div>
        )}
        {chatMenuOpen === conv.id && !renamingId && !selectionMode && (
          <div className="chat-context-menu anim-scale-in">
            <button onClick={e => handleRenameClick(e, conv.id, conv.title)}>Rename</button>
            <button onClick={e => handlePin(e, conv.id)}>{conv.pinned ? 'Unpin' : 'Pin'}</button>
            {!conv.pinned && <button onClick={e => handleMove(e, conv.id, -1)}><ArrowUp size={12} style={{marginRight: '6px'}}/> Move Up</button>}
            {!conv.pinned && <button onClick={e => handleMove(e, conv.id, 1)}><ArrowDown size={12} style={{marginRight: '6px'}}/> Move Down</button>}
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
          {open && (
            <button
              className={`icon-btn sidebar-search-btn ${searchOpen ? 'active-icon' : ''}`}
              onClick={() => setSearchOpen(o => !o)}
              title="Search chats"
            >
              <Search size={16} />
            </button>
          )}
        </div>

        {/* Search input */}
        {open && searchOpen && (
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
        {hasChats && (
          <button className="sidebar-new-chat" onClick={handleNewChat} id="new-chat-btn" title="New Chat">
            <Plus size={16} /> <span>New Chat</span>
          </button>
        )}

        <div className="sidebar-nav">
          {/* My Inventory */}
          <button
            className={`sidebar-nav-item ${location.pathname === '/inventory' ? 'active' : ''}`}
            onClick={() => navigate('/inventory')}
            title="My Inventory"
          >
            <Package size={16} /> <span>My Inventory</span>
          </button>

          {/* Seeds */}
          <div className="sidebar-section">
            <button
              className={`sidebar-nav-item ${location.pathname.startsWith('/seeds') ? 'active' : ''}`}
              onClick={() => navigate('/seeds')}
              id="seeds-nav-btn"
              title="Seeds"
            >
              <Sprout size={16} /> <span>Seeds</span>
              {open && (
                <button
                  className="expand-btn"
                  onClick={e => { e.stopPropagation(); setSeedsExpanded(p => !p); }}
                >
                  <ChevronDown size={13} className={`expand-icon ${seedsExpanded ? 'rotated' : ''}`} />
                </button>
              )}
            </button>

            {open && seedsExpanded && state.seeds.length > 0 && (
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

          {open && <div className="divider" />}

          {/* Chats section - ONLY show when sidebar is open */}
          {open && (
            <>
              {!selectionMode ? (
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
              ) : (
                <div className="sidebar-section-header" style={{ background: 'var(--accent-dim)', margin: '0 6px', borderRadius: '4px', padding: '12px 10px' }}>
                  <button onClick={() => { setSelectionMode(false); setSelectedChats([]); }} style={{ color: 'var(--text-muted)', fontSize: '0.75rem', background: 'none', border: 'none', cursor: 'pointer' }}>Cancel</button>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-primary)', fontWeight: 'bold' }}>{selectedChats.length} Selected</span>
                  <button style={{ color: '#ff5555', fontSize: '0.75rem', fontWeight: 'bold', background: 'none', border: 'none', cursor: 'pointer' }} onClick={() => {
                      selectedChats.forEach(id => dispatch({ type: 'DELETE_CONVERSATION', payload: id }));
                      setSelectionMode(false);
                      setSelectedChats([]);
                  }}>Delete</button>
                </div>
              )}

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
            </>
          )}
        </div>

        <div className="sidebar-footer">
          {/* Theme picker toggle */}
          <button
            className={`sidebar-nav-item ${showThemePicker ? 'active' : ''}`}
            onClick={() => setShowThemePicker(p => !p)}
            id="theme-picker-btn"
            title="Theme"
          >
            <Palette size={16} /> <span>Theme</span>
            {open && <ChevronRight size={13} className={`expand-icon ${showThemePicker ? 'rotated-right' : ''}`} />}
          </button>

          {open && showThemePicker && (
            <div className="anim-slide-up">
              <ThemePicker />
            </div>
          )}

          {/* Settings */}
          <button
            className={`sidebar-nav-item ${location.pathname === '/settings' ? 'active' : ''}`}
            onClick={() => navigate('/settings')}
            id="settings-nav-btn"
            title="Settings & Help"
          >
            <Settings size={16} /> <span>Settings & Help</span>
          </button>
        </div>
      </aside>
    </>
  );
}
