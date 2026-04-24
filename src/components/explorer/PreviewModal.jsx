import React from 'react';
import { X, FileText, Folder } from 'lucide-react';
import { useExplorer } from '../../context/ExplorerContext';
import { useChat } from '../../context/ChatContext';
import './PreviewModal.css';

function formatDate(ts) {
  if (!ts) return 'Unknown';
  return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function PreviewModal({ item, onClose }) {
  const { state: explorerState } = useExplorer();
  const { state: chatState } = useChat();

  if (!item) return null;

  const isChat = item.type === 'chat';
  const chatData = isChat ? chatState.conversations.find(c => c.id === item.id) : null;
  const title = isChat ? (chatData?.title || item.name) : item.name;

  let contents = [];
  if (!isChat) {
    contents = explorerState.tree.filter(n => n.parentId === item.id);
  }

  return (
    <div className="preview-modal-overlay anim-fade-in" onClick={onClose}>
      <div className="preview-modal glass-panel anim-scale-in" onClick={e => e.stopPropagation()}>
        <div className="preview-modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div className={`modal-icon ${isChat ? 'modal-chat-icon' : 'modal-folder-icon'}`}>
              {isChat ? <FileText size={20} /> : <Folder size={20} />}
            </div>
            <h3 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '1.1rem' }}>{title}</h3>
          </div>
          <button className="icon-btn" onClick={onClose} title="Close Preview"><X size={18} /></button>
        </div>
        
        <div className="preview-modal-body">
          <div className="meta-section">
            <div className="meta-row">
              <span className="meta-label">Type</span>
              <span className="meta-value">{isChat ? 'Chat Conversation' : 'Folder'}</span>
            </div>
            {isChat && chatData && (
              <>
                <div className="meta-row">
                  <span className="meta-label">Created</span>
                  <span className="meta-value">{formatDate(chatData.createdAt)}</span>
                </div>
                <div className="meta-row">
                  <span className="meta-label">Updated</span>
                  <span className="meta-value">{formatDate(chatData.updatedAt || chatData.createdAt)}</span>
                </div>
                <div className="meta-row">
                  <span className="meta-label">Messages</span>
                  <span className="meta-value">{chatData.messages?.length || 0}</span>
                </div>
              </>
            )}
            {!isChat && (
              <div className="meta-row">
                <span className="meta-label">Items inside</span>
                <span className="meta-value">{contents.length}</span>
              </div>
            )}
          </div>

          {!isChat && contents.length > 0 && (
            <div className="contents-section">
              <h4 className="contents-title">Folder Contents</h4>
              <div className="contents-list">
                {contents.map(child => (
                  <div key={child.id} className="content-list-item">
                    {child.type === 'chat' ? <FileText size={14} style={{ color: 'var(--accent)' }}/> : <Folder size={14} style={{ color: '#f59e0b' }}/>}
                    <span className="content-name">{child.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {isChat && chatData?.messages?.length > 0 && (
            <div className="contents-section">
              <h4 className="contents-title">Last Message</h4>
              <div className="preview-msg">
                {typeof chatData.messages[chatData.messages.length - 1].content === 'string'
                  ? chatData.messages[chatData.messages.length - 1].content.slice(0, 150) + (chatData.messages[chatData.messages.length - 1].content.length > 150 ? '...' : '')
                  : '(Interactive message)'}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
