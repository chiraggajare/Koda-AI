import React, { useState } from 'react';
import { useExplorer } from '../../context/ExplorerContext';
import { useChat } from '../../context/ChatContext';
import { MessageSquare, MoreHorizontal, Edit2, Trash2, FolderOutput, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSortable, SortableContext, rectSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const ChatCard = ({ tc, sq, getPathStr, allFolders }) => {
  const { state: explorerState, dispatch: explorerDispatch } = useExplorer();
  const { state: chatState, dispatch: chatDispatch } = useChat();
  const navigate = useNavigate();
  
  const [menuOpen, setMenuOpen] = useState(false);
  const [moveMenuOpen, setMoveMenuOpen] = useState(false);
  const [deleteMenuOpen, setDeleteMenuOpen] = useState(false);

  const isMultiSelected = explorerState.selectedItemIds.includes(tc.id);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id: tc.id,
    data: { type: 'chat', node: tc }
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleSelect = (e) => {
    e.stopPropagation();
    if (e.ctrlKey || e.metaKey || e.shiftKey) {
      explorerDispatch({ 
        type: 'SELECT_ITEM', 
        payload: { id: tc.id, isCtrl: e.ctrlKey || e.metaKey, isShift: e.shiftKey } 
      });
    } else {
      explorerDispatch({ type: 'SELECT_ITEM', payload: { id: tc.id, isCtrl: false, isShift: false } });
      chatDispatch({ type: 'SET_ACTIVE_CONVERSATION', payload: tc.id });
      navigate('/chat');
    }
  };

  const handleOpenChat = (e) => {
    e.stopPropagation();
    chatDispatch({ type: 'SET_ACTIVE_CONVERSATION', payload: tc.id });
    navigate('/chat');
    setMenuOpen(false);
  };

  const executeDelete = (e) => {
    e.stopPropagation();
    const idsToDelete = explorerState.selectedItemIds.length > 0 && explorerState.selectedItemIds.includes(tc.id)
      ? explorerState.selectedItemIds
      : [tc.id];

    idsToDelete.forEach(id => {
       const node = explorerState.tree.find(n => n.id === id);
       if (node?.type === 'chat') chatDispatch({ type: 'DELETE_CONVERSATION', payload: id });
    });
    explorerDispatch({ type: 'DELETE_ITEMS', payload: { itemIds: idsToDelete, moveChildrenToParent: true } });
    
    setDeleteMenuOpen(false);
    setMenuOpen(false);
  };

  const handleMove = (e, targetFolderId) => {
    e.stopPropagation();
    const idsToMove = explorerState.selectedItemIds.length > 0 && explorerState.selectedItemIds.includes(tc.id)
      ? explorerState.selectedItemIds
      : [tc.id];

    explorerDispatch({ type: 'MOVE_ITEMS', payload: { itemIds: idsToMove, targetFolderId } });
    setMoveMenuOpen(false);
    setMenuOpen(false);
  };

  return (
    <div 
      ref={setNodeRef}
      className={`chat-card anim-fade-in-up ${isMultiSelected ? 'selected-item' : ''} ${isDragging ? 'dragging' : ''} ${menuOpen ? 'menu-active' : ''}`}
      style={{ ...style, zIndex: menuOpen || isDragging ? 50 : 'auto' }}
      onClick={handleSelect}
      {...attributes}
      {...listeners}
    >
      <div className={`chat-card-info-wrap ${menuOpen ? 'menu-active' : ''}`}>
        <div className="chat-card-icon">
          <MessageSquare size={18} />
        </div>
        <div className="chat-card-info">
          <div className="chat-card-title">{tc.actualChat.title}</div>
          <div className="chat-card-meta">
            {sq 
              ? getPathStr(tc.parentId) 
              : `${new Date(tc.actualChat.createdAt).toLocaleDateString()} · ${tc.actualChat.messages.length} msgs`
            }
          </div>
        </div>
      </div>
      
      <div className="chat-card-actions" onPointerDown={e => e.stopPropagation()} onClick={e => e.stopPropagation()} style={{ pointerEvents: 'auto' }}>
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
                position: 'fixed', 
                top: 0, 
                left: 0, 
                width: '100vw', 
                height: '100vh', 
                zIndex: 9998, 
                background: 'transparent',
                pointerEvents: 'auto'
              }} 
              onClick={(e) => { 
                e.stopPropagation();
                setMenuOpen(false); 
                setMoveMenuOpen(false); 
                setDeleteMenuOpen(false);
              }} 
            />
            <div className="context-menu anim-scale-in" style={{ zIndex: 9999, pointerEvents: 'auto' }}>
              <button onClick={handleOpenChat}>
                <ExternalLink size={14} /> Open
              </button>
              <button onClick={(e) => { 
                e.stopPropagation(); 
                const newTitle = prompt('Enter new chat name:', tc.actualChat.title); 
                if(newTitle && newTitle.trim() !== '') { 
                  chatDispatch({ type: 'RENAME_CONVERSATION', payload: { conversationId: tc.id, title: newTitle.trim() } });
                  explorerDispatch({ type: 'SYNC_CHATS', payload: { chats: chatState.conversations } });
                }
                setMenuOpen(false);
              }}>
                <Edit2 size={14} /> Rename
              </button>
              <button onClick={() => { setMoveMenuOpen(!moveMenuOpen); setDeleteMenuOpen(false); }}>
                <FolderOutput size={14} /> Move to...
              </button>
              {moveMenuOpen && (
                <div className="sub-menu anim-fade-in" style={{ position: 'absolute', right: '100%', top: 0, marginTop: '-4px' }}>
                   {allFolders.map(f => (
                     <button 
                       key={f.id} 
                       onClick={(e) => handleMove(e, f.id)}
                       className={f.id === explorerState.selectedFolderId ? 'active-folder' : ''}
                     >
                       {f.name}
                     </button>
                   ))}
                </div>
              )}
              <button className="danger" style={{ position: 'relative' }} onClick={(e) => { e.stopPropagation(); setDeleteMenuOpen(!deleteMenuOpen); setMoveMenuOpen(false); }}>
                <Trash2 size={14} /> Delete {explorerState.selectedItemIds.length > 1 && explorerState.selectedItemIds.includes(tc.id) ? `(${explorerState.selectedItemIds.length})` : ''}
                {deleteMenuOpen && (
                  <div className="sub-menu anim-fade-in" style={{ position: 'absolute', right: '100%', top: 0, marginTop: '-4px' }} onClick={e => e.stopPropagation()}>
                    <button className="danger" onClick={executeDelete}>
                       Confirm Delete
                    </button>
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
  const { state: explorerState } = useExplorer();
  const { state: chatState } = useChat();
  
  const selectedFolderId = explorerState.selectedFolderId;
  const sq = explorerState.searchQuery.toLowerCase();

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

  let treeChats = [];
  if (sq) {
    treeChats = explorerState.tree.filter(n => n.type === 'chat' && (n.name?.toLowerCase().includes(sq)));
  } else {
    treeChats = explorerState.tree.filter(n => n.parentId === selectedFolderId && n.type === 'chat');
  }
  
  const displayChats = treeChats.map(tc => {
    const chat = chatState.conversations.find(c => c.id === tc.id);
    return { ...tc, actualChat: chat };
  }).filter(c => c.actualChat);

  const allFolders = explorerState.tree.filter(n => n.type === 'folder');

  return (
    <div className="chat-list-panel glass-panel">
      <div className="chat-list-header">
        <h3>{sq ? `Search Results for "${explorerState.searchQuery}"` : 'Contents'}</h3>
      </div>
      
      {displayChats.length === 0 ? (
        <div className="empty-state">
          <MessageSquare size={32} opacity={0.3} />
          <p>{sq ? 'No chats found matching your search' : 'No chats in this folder'}</p>
        </div>
      ) : (
        <div className="chat-grid">
          <SortableContext items={displayChats.map(c => c.id)} strategy={rectSortingStrategy}>
            {displayChats.map(tc => (
              <ChatCard 
                key={tc.id} 
                tc={tc} 
                sq={sq} 
                getPathStr={getPathStr} 
                allFolders={allFolders} 
              />
            ))}
          </SortableContext>
        </div>
      )}
    </div>
  );
}
