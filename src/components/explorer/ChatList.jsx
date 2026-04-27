import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useExplorer, getSubtree } from '../../context/ExplorerContext';
import { useChat } from '../../context/ChatContext';
import { useInteraction } from '../../context/InteractionContext';
import {
  MessageSquare, MoreHorizontal, Edit2, Trash2, FolderOutput,
  ExternalLink, Folder, FileText, Plus, FolderPlus, Pin, PinOff,
  ArrowUpDown, ChevronDown, Info, LayoutGrid, List
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSortable, SortableContext, rectSortingStrategy } from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { useVirtualizer } from '@tanstack/react-virtual';

const LONG_HOLD_MS = 500;
const HOLD_DRIFT_PX = 4;

// ─── Utility ──────────────────────────────────────────────
function formatDate(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  const now = new Date();
  const diff = Math.floor((now - d) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  if (diff < 7) return `${diff}d ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// ─── FolderCard ─ droppable only (prefixed ID avoids ID clash with FolderTree)
const FolderCard = ({ item, sq, getPathStr, allFolders, viewMode, index }) => {
  const { state: explorerState, dispatch: explorerDispatch } = useExplorer();
  const { state: ixState, dispatch: ixDispatch } = useInteraction();
  const [menuOpen, setMenuOpen] = useState(false);
  const [moveMenuOpen, setMoveMenuOpen] = useState(false);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
  const [renaming, setRenaming] = useState(false);
  const [renameVal, setRenameVal] = useState(item.name);
  const inputRef = useRef(null);
  const holdTimer = useRef(null);
  const holdPos = useRef({ x: 0, y: 0 });
  const isMultiSelected = ixState.selectedItems.has(item.id);
  const isChecked = ixState.checkedItems.has(item.id);
  const childCount = explorerState.tree.filter(n => n.parentId === item.id).length;
  const meta = sq ? getPathStr(item.parentId) : `${childCount} items`;

  // Use a PREFIXED droppable id so it never conflicts with FolderTree useSortable nodes
  const { setNodeRef, isOver } = useDroppable({
    id: `folder-card-${item.id}`,
    data: { type: 'folder', folderId: item.id }
  });

  const handleSelect = (e) => {
    e.stopPropagation();
    if (ixState.isCheckboxMode) { ixDispatch({ type: 'TOGGLE_CHECKBOX', payload: { id: item.id } }); return; }
    if (!e.ctrlKey && !e.metaKey) explorerDispatch({ type: 'SET_SELECTED_FOLDER', payload: item.id });
  };

  const handlePointerDown = (e) => {
    if (e.target.closest('button, input, a')) return;
    const isMeta = e.ctrlKey || e.metaKey;
    if (!isMeta && !ixState.selectedItems.has(item.id)) { ixDispatch({ type: 'CLEAR_SELECTION' }); ixDispatch({ type: 'TOGGLE_SELECT', payload: { id: item.id } }); }
    else if (isMeta) ixDispatch({ type: 'TOGGLE_SELECT', payload: { id: item.id } });
    holdPos.current = { x: e.clientX, y: e.clientY };
    holdTimer.current = setTimeout(() => { navigator.vibrate?.(30); ixDispatch({ type: 'ENTER_CHECKBOX_MODE', payload: item.id }); }, LONG_HOLD_MS);
  };
  const handlePointerMove = (e) => {
    if (!holdTimer.current) return;
    if (Math.hypot(e.clientX - holdPos.current.x, e.clientY - holdPos.current.y) > HOLD_DRIFT_PX) { clearTimeout(holdTimer.current); holdTimer.current = null; }
  };
  const handlePointerUp = () => { clearTimeout(holdTimer.current); holdTimer.current = null; };

  const handleRenameSave = () => {
    if (renameVal.trim()) explorerDispatch({ type: 'RENAME_NODE', payload: { id: item.id, name: renameVal.trim() } });
    setRenaming(false);
  };

  const executeDelete = (e) => {
    e.stopPropagation();
    const ids = ixState.selectedItems.size > 0 && ixState.selectedItems.has(item.id) ? Array.from(ixState.selectedItems) : [item.id];
    const deletedNodes = getSubtree(explorerState.tree, ids);
    explorerDispatch({ type: 'DELETE_ITEMS', payload: { itemIds: ids, moveChildrenToParent: false } });
    ixDispatch({ type: 'SHOW_TOAST', payload: { message: `${ids.length} item${ids.length > 1 ? 's' : ''} deleted`, undoType: 'UNDO_DELETE', undoPayload: { nodes: deletedNodes } } });
    setMenuOpen(false);
  };

  const handleMove = (e, targetFolderId) => {
    e.stopPropagation();
    const ids = ixState.selectedItems.size > 0 && ixState.selectedItems.has(item.id) ? Array.from(ixState.selectedItems) : [item.id];
    explorerDispatch({ type: 'MOVE_ITEMS', payload: { itemIds: ids, targetFolderId } });
    setMoveMenuOpen(false); setMenuOpen(false);
  };

  useEffect(() => { if (explorerState.editingId === item.id) { setRenaming(true); setRenameVal(item.name); } }, [explorerState.editingId, item.id]);
  useEffect(() => { if (renaming && inputRef.current) { inputRef.current.focus(); inputRef.current.select(); } }, [renaming]);
  useEffect(() => () => clearTimeout(holdTimer.current), []);

  return (
    <div
      ref={setNodeRef}
      className={['chat-card anim-fade-in-up', isMultiSelected ? 'is-selected' : '', viewMode === 'list' ? 'list-view' : '', isOver ? 'drop-target' : ''].join(' ')}
      style={{ zIndex: menuOpen ? 1000 : 1 }}
      onClick={handleSelect} onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={handlePointerUp}
    >
      {ixState.isCheckboxMode && (
        <input type="checkbox" className="row-checkbox" checked={isChecked}
          style={{ animationDelay: `${index * 20}ms` }}
          onChange={() => ixDispatch({ type: 'TOGGLE_CHECKBOX', payload: { id: item.id } })}
          onPointerDown={e => e.stopPropagation()} onClick={e => e.stopPropagation()} />
      )}
      <div className={`chat-card-info-wrap ${menuOpen ? 'menu-active' : ''}`}>
        <div className="chat-card-icon folder-icon-wrap"><Folder size={18} /></div>
        <div className="chat-card-info">
          {renaming ? (
            <input ref={inputRef} className="inline-rename-input" value={renameVal}
              onChange={e => setRenameVal(e.target.value)} onBlur={handleRenameSave}
              onKeyDown={e => { if (e.key === 'Enter') handleRenameSave(); if (e.key === 'Escape') setRenaming(false); }}
              onClick={e => e.stopPropagation()} />
          ) : (
            <div className="chat-card-title">{item.name}</div>
          )}
          <div className="chat-card-meta">{meta}</div>
        </div>
      </div>
      <div className="chat-card-actions" onPointerDown={e => e.stopPropagation()} onClick={e => e.stopPropagation()} style={{ pointerEvents: 'auto' }}>
        <button className="icon-btn action-btn" style={{ position: 'relative', zIndex: 9999 }}
          onClick={e => { const rect = e.currentTarget.getBoundingClientRect(); setMenuPos({ top: rect.bottom + 4, left: rect.right - 180 }); setMenuOpen(!menuOpen); }}>
          <MoreHorizontal size={16} />
        </button>
        {menuOpen && createPortal(
          <>
            <div className="menu-backdrop" style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 9998, background: 'transparent', pointerEvents: 'auto' }}
              onClick={e => { e.stopPropagation(); setMenuOpen(false); setMoveMenuOpen(false); }} />
            <div className="context-menu anim-scale-in" style={{ position: 'fixed', top: `${menuPos.top}px`, left: `${menuPos.left}px`, zIndex: 10000, pointerEvents: 'auto' }}>
              <button onClick={() => { explorerDispatch({ type: 'SET_SELECTED_FOLDER', payload: item.id }); setMenuOpen(false); }}><ExternalLink size={14} /> Open</button>
              <button onClick={() => { setRenaming(true); setMenuOpen(false); }}><Edit2 size={14} /> Rename</button>
              <button onClick={() => setMoveMenuOpen(!moveMenuOpen)}><FolderOutput size={14} /> Move to...</button>
              {moveMenuOpen && (
                <div className="sub-menu anim-fade-in" style={{ position: 'absolute', left: '100%', top: 0 }}>
                  {allFolders.filter(f => f.id !== item.id).map(f => <button key={f.id} onClick={e => handleMove(e, f.id)}>{f.name}</button>)}
                </div>
              )}
              <button className="danger" onClick={executeDelete}><Trash2 size={14} /> Delete</button>
            </div>
          </>, document.body
        )}
      </div>
    </div>
  );
};

// ─── GridCard ──────────────────────────────────────────────
const GridCard = ({ item, sq, getPathStr, allFolders, index, onPin, onPreview, viewMode }) => {
  const { state: explorerState, dispatch: explorerDispatch } = useExplorer();
  const { state: chatState, dispatch: chatDispatch } = useChat();
  const { state: ixState, dispatch: ixDispatch } = useInteraction();
  const navigate = useNavigate();

  const isChat = item.type === 'chat';

  const [menuOpen, setMenuOpen] = useState(false);
  const [moveMenuOpen, setMoveMenuOpen] = useState(false);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
  const [renaming, setRenaming] = useState(false);
  const [renameVal, setRenameVal] = useState(isChat ? item.actualChat?.title : item.name);

  const isMultiSelected = ixState.selectedItems.has(item.id);
  const isChecked = ixState.checkedItems.has(item.id);
  const isPinned = item.pinned || item.actualChat?.pinned;

  const inputRef = useRef(null);
  const holdTimer = useRef(null);
  const holdPos = useRef({ x: 0, y: 0 });

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
    data: { type: isChat ? 'chat' : 'folder', node: item }
  });

  const style = { transform: CSS.Transform.toString(transform), transition };

  const handleSelect = (e) => {
    e.stopPropagation();
    if (ixState.isCheckboxMode) {
      ixDispatch({ type: 'TOGGLE_CHECKBOX', payload: { id: item.id } });
      return;
    }
    if (!e.ctrlKey && !e.metaKey) {
      if (isChat) {
        chatDispatch({ type: 'SET_ACTIVE_CONVERSATION', payload: item.id });
        navigate('/chat');
      } else {
        explorerDispatch({ type: 'SET_SELECTED_FOLDER', payload: item.id });
      }
    }
  };

  const handleOpen = (e) => {
    e.stopPropagation();
    if (isChat) {
      chatDispatch({ type: 'SET_ACTIVE_CONVERSATION', payload: item.id });
      navigate('/chat');
    } else {
      explorerDispatch({ type: 'SET_SELECTED_FOLDER', payload: item.id });
    }
    setMenuOpen(false);
  };

  const executeDelete = (e, moveChildrenToParent = true) => {
    e.stopPropagation();
    const idsToDelete = ixState.selectedItems.size > 0 && ixState.selectedItems.has(item.id)
      ? Array.from(ixState.selectedItems) : [item.id];
    const deletedNodes = getSubtree(explorerState.tree, idsToDelete);
    explorerDispatch({ type: 'DELETE_ITEMS', payload: { itemIds: idsToDelete, moveChildrenToParent } });
    ixDispatch({
      type: 'SHOW_TOAST',
      payload: {
        message: `${idsToDelete.length} item${idsToDelete.length > 1 ? 's' : ''} deleted`,
        undoType: 'UNDO_DELETE',
        undoPayload: { nodes: deletedNodes }
      },
    });
    setDeleteMenuOpen(false);
    setMenuOpen(false);
  };

  const handleMove = (e, targetFolderId) => {
    e.stopPropagation();
    const idsToMove = ixState.selectedItems.size > 0 && ixState.selectedItems.has(item.id)
      ? Array.from(ixState.selectedItems) : [item.id];
    explorerDispatch({ type: 'MOVE_ITEMS', payload: { itemIds: idsToMove, targetFolderId } });
    setMoveMenuOpen(false);
    setMenuOpen(false);
  };

  const handlePointerDown = (e) => {
    if (e.target.closest('button, input, a')) return;
    const isMeta = e.ctrlKey || e.metaKey;
    const isSelected = ixState.selectedItems.has(item.id);
    if (!isMeta && !isSelected) {
      ixDispatch({ type: 'CLEAR_SELECTION' });
      ixDispatch({ type: 'TOGGLE_SELECT', payload: { id: item.id } });
    } else if (isMeta) {
      ixDispatch({ type: 'TOGGLE_SELECT', payload: { id: item.id } });
    }
    holdPos.current = { x: e.clientX, y: e.clientY };
    holdTimer.current = setTimeout(() => {
      navigator.vibrate?.(30);
      ixDispatch({ type: 'ENTER_CHECKBOX_MODE', payload: item.id });
    }, LONG_HOLD_MS);
  };

  const handlePointerMove = (e) => {
    if (!holdTimer.current) return;
    const dx = e.clientX - holdPos.current.x;
    const dy = e.clientY - holdPos.current.y;
    if (Math.hypot(dx, dy) > HOLD_DRIFT_PX) { clearTimeout(holdTimer.current); holdTimer.current = null; }
  };

  const handlePointerUp = () => { clearTimeout(holdTimer.current); holdTimer.current = null; };

  useEffect(() => {
    if (explorerState.editingId === item.id) {
      setRenaming(true);
      setRenameVal(isChat ? item.actualChat?.title : item.name);
    }
  }, [explorerState.editingId, item.id]);

  useEffect(() => {
    if (renaming && inputRef.current) { inputRef.current.focus(); inputRef.current.select(); }
  }, [renaming]);

  useEffect(() => () => clearTimeout(holdTimer.current), []);

  const handleRenameSave = () => {
    if (renameVal.trim() !== '') {
      if (isChat) {
        chatDispatch({ type: 'RENAME_CONVERSATION', payload: { conversationId: item.id, title: renameVal.trim() } });
        explorerDispatch({ type: 'SYNC_CHATS', payload: { chats: chatState.conversations } });
      } else {
        explorerDispatch({ type: 'RENAME_NODE', payload: { id: item.id, name: renameVal.trim() } });
      }
    }
    setRenaming(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleRenameSave();
    if (e.key === 'Escape') { setRenaming(false); explorerDispatch({ type: 'SET_EDITING_ID', payload: null }); }
  };

  const meta = useMemo(() => {
    if (sq) return getPathStr(item.parentId);
    if (isChat) {
      const ts = item.actualChat?.updatedAt || item.actualChat?.createdAt;
      return formatDate(ts);
    }
    return `${explorerState.tree.filter(n => n.parentId === item.id).length} items`;
  }, [sq, isChat, item, explorerState.tree, getPathStr]);

  return (
    <div
      ref={setNodeRef}
      className={[
        'chat-card anim-fade-in-up',
        isMultiSelected ? 'is-selected' : '',
        isDragging ? 'dragging' : '',
        isPinned ? 'is-pinned' : '',
        viewMode === 'list' ? 'list-view' : '',
      ].join(' ')}
      style={{ ...style, zIndex: menuOpen ? 1000 : (isDragging ? 500 : 1) }}
      onClick={handleSelect}
      onPointerDown={(e) => { handlePointerDown(e); listeners?.onPointerDown?.(e); }}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      {...attributes}
      onKeyDown={listeners?.onKeyDown}
      onKeyUp={listeners?.onKeyUp}
    >
      {isPinned && <div className="pin-badge"><Pin size={9} /></div>}

      {ixState.isCheckboxMode && (
        <input
          type="checkbox"
          className="row-checkbox"
          checked={isChecked}
          style={{ animationDelay: `${index * 20}ms` }}
          onChange={() => ixDispatch({ type: 'TOGGLE_CHECKBOX', payload: { id: item.id } })}
          onPointerDown={e => e.stopPropagation()}
          onClick={e => e.stopPropagation()}
        />
      )}

      <div className={`chat-card-info-wrap ${menuOpen ? 'menu-active' : ''}`}>
        <div className={`chat-card-icon ${isChat ? 'chat-icon-wrap' : 'folder-icon-wrap'}`}>
          {isChat ? <FileText size={18} /> : <Folder size={18} />}
        </div>
        <div className="chat-card-info">
          {renaming ? (
            <input
              ref={inputRef}
              className="inline-rename-input"
              value={renameVal}
              onChange={(e) => setRenameVal(e.target.value)}
              onBlur={handleRenameSave}
              onKeyDown={handleKeyDown}
              onClick={e => e.stopPropagation()}
            />
          ) : (
            <div className="chat-card-title">{isChat ? item.actualChat?.title : item.name}</div>
          )}
          <div className="chat-card-meta">{meta}</div>
        </div>
      </div>

      <div
        className="chat-card-actions"
        onPointerDown={e => e.stopPropagation()}
        onClick={e => e.stopPropagation()}
        style={{ pointerEvents: 'auto' }}
      >
        <button
          className="icon-btn action-btn"
          style={{ position: 'relative', zIndex: 9999 }}
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            setMenuPos({ top: rect.bottom + 4, left: rect.right - 180 });
            setMenuOpen(!menuOpen);
          }}
        >
          <MoreHorizontal size={16} />
        </button>
        {menuOpen && createPortal(
          <>
            <div
              className="menu-backdrop"
              style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 9998, background: 'transparent', pointerEvents: 'auto' }}
              onClick={(e) => { e.stopPropagation(); setMenuOpen(false); setMoveMenuOpen(false); }}
            />
            <div className="context-menu anim-scale-in" style={{ 
              position: 'fixed', 
              top: `${menuPos.top}px`, 
              left: `${menuPos.left}px`,
              zIndex: 10000, 
              pointerEvents: 'auto' 
            }}>
              <button onClick={(e) => { e.stopPropagation(); onPreview?.(item); setMenuOpen(false); }}>
                <Info size={14} /> Preview
              </button>
              <button onClick={handleOpen}><ExternalLink size={14} /> Open</button>
              <button onClick={(e) => { e.stopPropagation(); setRenaming(true); setRenameVal(isChat ? item.actualChat?.title : item.name); setMenuOpen(false); }}>
                <Edit2 size={14} /> Rename
              </button>
              {isChat && (
                <button onClick={() => { onPin?.(item); setMenuOpen(false); }}>
                  {isPinned ? <PinOff size={14} /> : <Pin size={14} />}
                  {isPinned ? 'Unpin' : 'Pin'}
                </button>
              )}
              <button onClick={() => { setMoveMenuOpen(!moveMenuOpen); setDeleteMenuOpen(false); }}>
                <FolderOutput size={14} /> Move to...
              </button>
              {moveMenuOpen && (
                <div className="sub-menu anim-fade-in" style={{ position: 'absolute', left: '100%', top: 0, marginTop: '-4px' }}>
                  {allFolders.map(f => {
                    const disabled = !isChat && (f.id === item.id || getSubtree(explorerState.tree, [item.id]).some(n => n.id === f.id));
                    return (
                      <button
                        key={f.id}
                        onClick={(e) => { if (!disabled) handleMove(e, f.id); }}
                        className={f.id === explorerState.selectedFolderId ? 'active-folder' : ''}
                        style={disabled ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
                      >
                        {f.name}
                      </button>
                    );
                  })}
                </div>
              )}
              <button
                className="danger"
                onClick={(e) => executeDelete(e, false)}
              >
                <Trash2 size={14} /> Delete {ixState.selectedItems.size > 1 && ixState.selectedItems.has(item.id) ? `(${ixState.selectedItems.size})` : ''}
              </button>
            </div>
          </>,
          document.body
        )}
      </div>
    </div>
  );
};

// ─── ChatList (Main) ───────────────────────────────────────
export default function ChatList({ onItemPreview }) {
  const { state: explorerState, dispatch: explorerDispatch } = useExplorer();
  const { state: chatState, dispatch: chatDispatch } = useChat();
  const { state: ixState, dispatch: ixDispatch } = useInteraction();
  const navigate = useNavigate();

  const [sortBy, setSortBy] = useState('name'); // 'name' | 'date'
  const [sortDir, setSortDir] = useState('asc');
  const [viewMode, setViewMode] = useState('grid');
  const [pinnedIds, setPinnedIds] = useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem('koda_pinned') || '[]')); }
    catch { return new Set(); }
  });

  const selectedFolderId = explorerState.selectedFolderId;
  const sq = explorerState.searchQuery.toLowerCase();

  const handleCreateChat = () => {
    chatDispatch({ type: 'NEW_CONVERSATION', payload: { force: true } });
    navigate('/chat');
  };

  const handleCreateFolder = () => {
    explorerDispatch({ type: 'CREATE_FOLDER', payload: { name: 'New Folder', parentId: selectedFolderId } });
  };

  const handlePin = useCallback((item) => {
    setPinnedIds(prev => {
      const next = new Set(prev);
      if (next.has(item.id)) next.delete(item.id);
      else next.add(item.id);
      localStorage.setItem('koda_pinned', JSON.stringify([...next]));
      return next;
    });
  }, []);

  const getPathStr = useCallback((nodeId) => {
    let currentId = nodeId;
    const path = [];
    while (currentId) {
      const node = explorerState.tree.find(n => n.id === currentId);
      if (!node) break;
      if (node.id !== 'root') path.unshift(node.name);
      currentId = node.parentId;
    }
    return ['Root', ...path].join(' → ');
  }, [explorerState.tree]);

  const allFolders = useMemo(() => explorerState.tree.filter(n => n.type === 'folder'), [explorerState.tree]);
  const currentFolder = useMemo(() => explorerState.tree.find(n => n.id === selectedFolderId), [explorerState.tree, selectedFolderId]);

  const headerTitle = sq
    ? `Results for "${explorerState.searchQuery}"`
    : (currentFolder ? currentFolder.name : 'Contents');

  // Build display items
  const displayItems = useMemo(() => {
    let treeItems = [];
    if (sq) {
      treeItems = explorerState.tree.filter(n => n.id !== 'root' && n.name?.toLowerCase().includes(sq));
    } else {
      treeItems = explorerState.tree.filter(n => n.parentId === selectedFolderId);
    }

    return treeItems.map(tc => {
      if (tc.type === 'chat') {
        const chat = chatState.conversations.find(c => c.id === tc.id && !c.isTemporary);
        if (!chat) return null;
        return { ...tc, actualChat: chat, pinned: pinnedIds.has(tc.id) };
      }
      return tc;
    }).filter(Boolean);
  }, [explorerState.tree, chatState.conversations, selectedFolderId, sq, pinnedIds]);

  // Split into pinned / rest
  const { pinnedItems, regularItems } = useMemo(() => {
    const sortFn = (a, b) => {
      if (a.type !== b.type) {
        return a.type === 'folder' ? -1 : 1;
      }
      if (sortBy === 'date') {
        const ta = a.actualChat?.updatedAt || a.actualChat?.createdAt || 0;
        const tb = b.actualChat?.updatedAt || b.actualChat?.createdAt || 0;
        return sortDir === 'asc' ? ta - tb : tb - ta;
      }
      const na = (a.actualChat?.title || a.name || '').toLowerCase();
      const nb = (b.actualChat?.title || b.name || '').toLowerCase();
      return sortDir === 'asc' ? na.localeCompare(nb) : nb.localeCompare(na);
    };

    if (sq) {
      return { pinnedItems: [], regularItems: [...displayItems].sort(sortFn) };
    }
    
    const pinned = displayItems.filter(i => pinnedIds.has(i.id));
    const regular = displayItems.filter(i => !pinnedIds.has(i.id));

    return {
      pinnedItems: [...pinned].sort(sortFn),
      regularItems: [...regular].sort(sortFn),
    };
  }, [displayItems, pinnedIds, sortBy, sortDir, sq]);

  const toggleSort = (key) => {
    if (sortBy === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortBy(key); setSortDir('asc'); }
  };

  // Virtualizer for large lists
  const parentRef = useRef(null);
  const allRows = useMemo(() => {
    const rows = [];
    
    if (pinnedItems.length > 0 && !sq) {
      rows.push({ type: 'section', label: '📌 Pinned' });
      rows.push(...pinnedItems);
    }
    
    const folders = regularItems.filter(i => i.type === 'folder');
    const chats = regularItems.filter(i => i.type === 'chat');

    if (folders.length > 0) {
      rows.push({ type: 'section', label: 'Folders' });
      rows.push(...folders);
    }

    if (chats.length > 0) {
      rows.push({ type: 'section', label: 'Chats' });
      rows.push(...chats);
    }
    
    return rows;
  }, [pinnedItems, regularItems, sq]);

  const useVirt = allRows.length > 50;
  const rowVirtualizer = useVirtualizer({
    count: allRows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: (i) => allRows[i]?.type === 'section' ? 36 : 80,
    overscan: 10,
    enabled: useVirt,
  });

  return (
    <div className="chat-list-panel glass-panel">
      {/* Header */}
      <div className="chat-list-header">
        <h3>{headerTitle}</h3>
        <div className="header-actions">
          <div className="sort-controls">
            <button
              className={`sort-btn ${sortBy === 'name' ? 'sort-active' : ''}`}
              onClick={() => toggleSort('name')}
              title="Sort by name"
            >
              A–Z
              {sortBy === 'name' && <ChevronDown size={11} style={{ transform: sortDir === 'desc' ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />}
            </button>
            <button
              className={`sort-btn ${sortBy === 'date' ? 'sort-active' : ''}`}
              onClick={() => toggleSort('date')}
              title="Sort by date"
            >
              Date
              {sortBy === 'date' && <ChevronDown size={11} style={{ transform: sortDir === 'desc' ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />}
            </button>
          </div>
          <div className="sort-controls">
            <button
              className={`sort-btn ${viewMode === 'grid' ? 'sort-active' : ''}`}
              onClick={() => setViewMode('grid')}
              title="Grid View"
            >
              <LayoutGrid size={13} />
            </button>
            <button
              className={`sort-btn ${viewMode === 'list' ? 'sort-active' : ''}`}
              onClick={() => setViewMode('list')}
              title="List View"
            >
              <List size={13} />
            </button>
          </div>
          <button className="header-action-btn" onClick={handleCreateChat}>
            <Plus size={16} /> New Chat
          </button>
          <button className="header-action-btn" onClick={handleCreateFolder}>
            <FolderPlus size={16} /> New Folder
          </button>
        </div>
      </div>

      {/* Content */}
      {displayItems.length === 0 ? (
        <div className="empty-state">
          <Folder size={32} opacity={0.3} />
          <p>{sq ? 'No items found' : 'This folder is empty'}</p>
        </div>
      ) : (
        <div className="chat-list-body" ref={parentRef}>
          {useVirt ? (
            <div style={{ height: `${rowVirtualizer.getTotalSize()}px`, position: 'relative' }}>
              {rowVirtualizer.getVirtualItems().map(virtualRow => {
                const row = allRows[virtualRow.index];
                if (!row) return null;
                return (
                  <div
                    key={virtualRow.key}
                    style={{
                      position: 'absolute',
                      top: virtualRow.start,
                      width: '100%',
                      padding: '0 16px',
                    }}
                  >
                    {row.type === 'section' ? (
                      <div className="list-section-label">{row.label}</div>
                    ) : row.type === 'folder' ? (
                      <FolderCard
                        key={row.id}
                        item={row}
                        sq={sq}
                        getPathStr={getPathStr}
                        allFolders={allFolders}
                        index={virtualRow.index}
                        viewMode={viewMode}
                      />
                    ) : (
                      <SortableContext items={[row.id]} strategy={rectSortingStrategy}>
                        <GridCard
                          item={row}
                          sq={sq}
                          getPathStr={getPathStr}
                          allFolders={allFolders}
                          index={virtualRow.index}
                          onPin={handlePin}
                          onPreview={onItemPreview}
                          viewMode={viewMode}
                        />
                      </SortableContext>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <SortableContext items={displayItems.map(c => c.id)} strategy={rectSortingStrategy}>
              <div className={`chat-grid-inner ${viewMode === 'list' ? 'list-view' : ''}`}>
                {allRows.map((row, i) => {
                  if (row.type === 'section') {
                    return <div key={`section-${i}`} className="list-section-label">{row.label}</div>;
                  }
                  return row.type === 'folder' ? (
                    <FolderCard
                      key={row.id}
                      item={row}
                      sq={sq}
                      getPathStr={getPathStr}
                      allFolders={allFolders}
                      index={i}
                      viewMode={viewMode}
                    />
                  ) : (
                    <GridCard
                      key={row.id}
                      item={row}
                      sq={sq}
                      getPathStr={getPathStr}
                      allFolders={allFolders}
                      index={i}
                      onPin={handlePin}
                      onPreview={onItemPreview}
                      viewMode={viewMode}
                    />
                  );
                })}
              </div>
            </SortableContext>
          )}
        </div>
      )}
    </div>
  );
}
