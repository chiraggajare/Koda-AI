import React, { useState, useRef, useEffect } from 'react';
import { useExplorer, getSubtree } from '../../context/ExplorerContext';
import { useChat } from '../../context/ChatContext';
import { useInteraction } from '../../context/InteractionContext';
import { MessageSquare, MoreHorizontal, Edit2, Trash2, FolderOutput, ExternalLink, Folder, FileText, Plus, FolderPlus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSortable, SortableContext, rectSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const LONG_HOLD_MS = 500;
const HOLD_DRIFT_PX = 4;

const GridCard = ({ item, sq, getPathStr, allFolders, index }) => {
  const { state: explorerState, dispatch: explorerDispatch } = useExplorer();
  const { state: chatState, dispatch: chatDispatch } = useChat();
  const { state: ixState, dispatch: ixDispatch } = useInteraction();
  const navigate = useNavigate();

  const isChat = item.type === 'chat';

  const [menuOpen, setMenuOpen] = useState(false);
  const [moveMenuOpen, setMoveMenuOpen] = useState(false);
  const [deleteMenuOpen, setDeleteMenuOpen] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [renameVal, setRenameVal] = useState(isChat ? item.actualChat.title : item.name);

  const isMultiSelected = ixState.selectedItems.has(item.id);
  const isChecked = ixState.checkedItems.has(item.id);

  const inputRef = useRef(null);
  const holdTimer = useRef(null);
  const holdPos = useRef({ x: 0, y: 0 });

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: item.id,
    data: { type: isChat ? 'chat' : 'folder', node: item }
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleSelect = (e) => {
    e.stopPropagation();
    if (ixState.isCheckboxMode) {
      ixDispatch({ type: 'TOGGLE_CHECKBOX', payload: { id: item.id } });
      return;
    }
    
    // If not multi-selecting, handle opening/navigation
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
      ? Array.from(ixState.selectedItems)
      : [item.id];
    
    // Store items for undo before deleting
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
      ? Array.from(ixState.selectedItems)
      : [item.id];
    explorerDispatch({ type: 'MOVE_ITEMS', payload: { itemIds: idsToMove, targetFolderId } });
    setMoveMenuOpen(false);
    setMenuOpen(false);
  };

  // Long-hold for checkbox mode
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
    if (Math.hypot(dx, dy) > HOLD_DRIFT_PX) {
      clearTimeout(holdTimer.current);
      holdTimer.current = null;
    }
  };

  const handlePointerUp = () => {
    clearTimeout(holdTimer.current);
    holdTimer.current = null;
  };

  useEffect(() => {
    if (explorerState.editingId === item.id) {
      setRenaming(true);
      setRenameVal(isChat ? item.actualChat.title : item.name);
    }
  }, [explorerState.editingId, item.id]);

  useEffect(() => {
    if (renaming && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
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
    if (e.key === 'Escape') {
      setRenaming(false);
      explorerDispatch({ type: 'SET_EDITING_ID', payload: null });
    }
  };

  return (
    <div
      ref={setNodeRef}
      className={[
        'chat-card anim-fade-in-up',
        isMultiSelected ? 'is-selected' : '',
        isDragging ? 'dragging' : '',
      ].join(' ')}
      style={{ ...style, zIndex: menuOpen ? 1000 : (isDragging ? 500 : 1) }}
      onClick={handleSelect}
      onPointerDown={(e) => {
        handlePointerDown(e);
        listeners?.onPointerDown?.(e);
      }}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      {...attributes}
      onKeyDown={listeners?.onKeyDown}
      onKeyUp={listeners?.onKeyUp}
    >
      {/* Checkbox */}
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
            <div className="chat-card-title">{isChat ? item.actualChat.title : item.name}</div>
          )}
          <div className="chat-card-meta">
            {sq
              ? getPathStr(item.parentId)
              : isChat
                ? `${new Date(item.actualChat.createdAt).toLocaleDateString()} · ${item.actualChat.messages.length} msgs`
                : `${explorerState.tree.filter(n => n.parentId === item.id).length} items`
            }
          </div>
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
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <MoreHorizontal size={16} />
        </button>
        {menuOpen && (
          <>
            <div
              className="menu-backdrop"
              style={{
                position: 'fixed', top: 0, left: 0,
                width: '100vw', height: '100vh',
                zIndex: 9998, background: 'transparent', pointerEvents: 'auto'
              }}
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpen(false);
                setMoveMenuOpen(false);
                setDeleteMenuOpen(false);
              }}
            />
            <div className="context-menu anim-scale-in" style={{ zIndex: 9999, pointerEvents: 'auto' }}>
              <button onClick={handleOpen}>
                <ExternalLink size={14} /> Open
              </button>
              <button onClick={(e) => {
                e.stopPropagation();
                setRenaming(true);
                setRenameVal(isChat ? item.actualChat.title : item.name);
                setMenuOpen(false);
              }}>
                <Edit2 size={14} /> Rename
              </button>
              <button onClick={() => { setMoveMenuOpen(!moveMenuOpen); setDeleteMenuOpen(false); }}>
                <FolderOutput size={14} /> Move to...
              </button>
              {moveMenuOpen && (
                <div className="sub-menu anim-fade-in" style={{ position: 'absolute', right: '100%', top: 0, marginTop: '-4px' }}>
                  {allFolders.map(f => {
                    const disabled = !isChat && (f.id === item.id || getSubtree(explorerState.tree, [item.id]).some(n => n.id === f.id));
                    return (
                      <button
                        key={f.id}
                        onClick={(e) => {
                          if (!disabled) handleMove(e, f.id);
                        }}
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
                style={{ position: 'relative' }}
                onClick={(e) => { e.stopPropagation(); setDeleteMenuOpen(!deleteMenuOpen); setMoveMenuOpen(false); }}
              >
                <Trash2 size={14} /> Delete {ixState.selectedItems.size > 1 && ixState.selectedItems.has(item.id) ? `(${ixState.selectedItems.size})` : ''}
                {deleteMenuOpen && (
                  <div
                    className="sub-menu anim-fade-in"
                    style={{ position: 'absolute', right: '100%', top: 0, marginTop: '-4px' }}
                    onClick={e => e.stopPropagation()}
                  >
                    {!isChat && (ixState.selectedItems.size === 0 || (ixState.selectedItems.size === 1 && ixState.selectedItems.has(item.id))) ? (
                      <>
                        <button className="danger" onClick={(e) => executeDelete(e, false)}>
                          Delete Everything
                        </button>
                        <button onClick={(e) => executeDelete(e, true)}>
                          Keep Contents
                        </button>
                      </>
                    ) : (
                      <button className="danger" onClick={(e) => executeDelete(e, true)}>
                        Confirm
                      </button>
                    )}
                  </div>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default function ChatList() {
  const { state: explorerState, dispatch: explorerDispatch } = useExplorer();
  const { state: chatState, dispatch: chatDispatch } = useChat();
  const navigate = useNavigate();

  const selectedFolderId = explorerState.selectedFolderId;
  const sq = explorerState.searchQuery.toLowerCase();

  const handleCreateChat = () => {
    chatDispatch({ type: 'NEW_CONVERSATION', payload: { force: true } });
    // Note: Explorer SYNC_CHATS happens automatically via useEffect in ExplorerPage
    navigate('/chat');
  };

  const handleCreateFolder = () => {
    explorerDispatch({ type: 'CREATE_FOLDER', payload: { name: 'New Folder', parentId: selectedFolderId } });
  };

  const getPathStr = (nodeId) => {
    let currentId = nodeId;
    const path = [];
    while (currentId) {
      const node = explorerState.tree.find(n => n.id === currentId);
      if (!node) break;
      if (node.id !== 'root') path.unshift(node.name);
      currentId = node.parentId;
    }
    return ['Root', ...path].join(' → ');
  };

  let treeItems = [];
  if (sq) {
    treeItems = explorerState.tree.filter(n => n.id !== 'root' && (n.name?.toLowerCase().includes(sq)));
  } else {
    treeItems = explorerState.tree.filter(n => n.parentId === selectedFolderId);
  }

  const displayItems = treeItems.map(tc => {
    if (tc.type === 'chat') {
      const chat = chatState.conversations.find(c => c.id === tc.id);
      if (!chat) return null;
      return { ...tc, actualChat: chat };
    }
    return tc;
  }).filter(Boolean);

  const allFolders = explorerState.tree.filter(n => n.type === 'folder');
  const currentFolder = explorerState.tree.find(n => n.id === selectedFolderId);
  const headerTitle = sq 
    ? `Search Results for "${explorerState.searchQuery}"` 
    : (currentFolder ? currentFolder.name : 'Contents');

  return (
    <div className="chat-list-panel glass-panel">
      <div className="chat-list-header">
        <h3>{headerTitle}</h3>
        <div className="header-actions">
          <button className="header-action-btn" onClick={handleCreateChat}>
            <Plus size={16} /> New Chat
          </button>
          <button className="header-action-btn" onClick={handleCreateFolder}>
            <FolderPlus size={16} /> New Folder
          </button>
        </div>
      </div>

      {displayItems.length === 0 ? (
        <div className="empty-state">
          <Folder size={32} opacity={0.3} />
          <p>{sq ? 'No items found matching your search' : 'This folder is empty'}</p>
        </div>
      ) : (
        <div className="chat-grid">
          <SortableContext items={displayItems.map(c => c.id)} strategy={rectSortingStrategy}>
            {displayItems.map((item, i) => (
              <GridCard
                key={item.id}
                item={item}
                sq={sq}
                getPathStr={getPathStr}
                allFolders={allFolders}
                index={i}
              />
            ))}
          </SortableContext>
        </div>
      )}
    </div>
  );
}
