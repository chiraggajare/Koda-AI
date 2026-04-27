import React, { useState, useRef, useEffect } from 'react';
import {
  ThumbsUp, ThumbsDown, RotateCcw, Copy, MoreHorizontal,
  Volume2, VolumeX, Share, Mail, Flag, Check, Zap, Brain, BarChart3,
  Edit2
} from 'lucide-react';
import { useChat } from '../../context/ChatContext';
import './MessageBubble.css';

const MODEL_LABELS = { fast: 'Fast', thinking: 'Thinking', deep: 'Deep Analysis' };
const MODEL_ICONS = { fast: Zap, thinking: Brain, deep: BarChart3 };

function TypingIndicator() {
  return (
    <div className="typing-indicator">
      <span /><span /><span />
    </div>
  );
}

function renderMarkdown(text) {
  // Very lightweight markdown: bold, code blocks, inline code, bullets
  return text
    .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
    .replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/^- (.+)$/gm, '• $1')
    .replace(/\n/g, '<br/>');
}

export default function MessageBubble({ message, conversationId, isEditing, setEditingId, onResend }) {
  const { dispatch, sendMessage, state, activeConversation } = useChat();
  const [copied, setCopied] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [editValue, setEditValue] = useState(message.content);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const textareaRef = useRef(null);

  const handleStopSpeech = () => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  };

  useEffect(() => {
    if (isEditing) {
      setEditValue(message.content);
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
          textareaRef.current.setSelectionRange(message.content.length, message.content.length);
          textareaRef.current.style.height = 'auto';
          textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
        }
      }, 10);
    }
  }, [isEditing, message.content]);

  const handleEditInput = (e) => {
    setEditValue(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${e.target.scrollHeight}px`;
  };

  const isUser = message.role === 'user';
  const isLoading = message.loading;

  const handleLike = (val) => {
    dispatch({
      type: 'UPDATE_MESSAGE',
      payload: {
        conversationId,
        messageId: message.id,
        updates: { liked: message.liked === val ? null : val },
      },
    });
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleRedo = () => {
    if (!activeConversation) return;
    const msgs = activeConversation.messages;
    const idx = msgs.findIndex(m => m.id === message.id);
    const prevUser = msgs.slice(0, idx).reverse().find(m => m.role === 'user');
    if (prevUser) sendMessage(conversationId, prevUser.content, activeConversation.model);
  };

  const handleListen = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel(); // Stop any current speech
      const utt = new SpeechSynthesisUtterance(message.content);
      utt.onstart = () => setIsSpeaking(true);
      utt.onend = () => setIsSpeaking(false);
      utt.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utt);
    }
  };

  const handleSaveEdit = () => {
    if (editValue.trim() && editValue !== message.content) {
      if (onResend) onResend(editValue.trim());
    } else {
      if (setEditingId) setEditingId(null);
    }
  };

  const ModelIcon = message.model ? MODEL_ICONS[message.model] : Zap;

  return (
    <div className={`message-row ${isUser ? 'user' : 'assistant'} anim-fade-in-up`}>
      {!isUser && (
        <div className="message-avatar ai-avatar">
          <span className="brand-dot-sm" />
        </div>
      )}

      {isUser && (
        <div className="message-avatar user-avatar">
          {state.user.avatar}
        </div>
      )}

      <div className="message-group" style={{ width: isEditing ? '100%' : 'auto', maxWidth: isEditing ? '780px' : '72%' }}>
        <div className={`message-bubble ${isUser ? 'user-bubble' : 'ai-bubble'}`}>
          {isLoading ? (
            <TypingIndicator />
          ) : (
            <div
              className="message-content"
              style={{ opacity: isEditing ? 0.5 : 1, transition: 'opacity 0.2s' }}
              dangerouslySetInnerHTML={{ __html: renderMarkdown(message.content) }}
            />
          )}

          {/* Message hover actions (Pill style) */}
          {!isLoading && !isEditing && (
            <div className={`message-bubble-actions ${isUser ? 'user-actions' : 'ai-actions'}`}>
              <button className={`action-btn-sm ${copied ? 'copied' : ''}`} onClick={handleCopy} title="Copy">
                {copied ? <Check size={12} /> : <Copy size={12} />}
              </button>
              {isUser ? (
                <button className="action-btn-sm" title="Edit" onClick={() => setEditingId && setEditingId(message.id)}>
                  <Edit2 size={12} />
                </button>
              ) : (
                <button className="action-btn-sm" title="Redo" onClick={handleRedo}>
                  <RotateCcw size={12} />
                </button>
              )}
            </div>
          )}

          {/* Edited Indicator */}
          {message.isEdited && !isEditing && (
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textAlign: isUser ? 'right' : 'left', marginTop: '4px', opacity: 0.7 }}>(Edited)</div>
          )}
        </div>

        {/* Secondary Edit Box directly below the message */}
        {isEditing && (
          <div className="inline-edit-wrapper anim-fade-in-up" style={{
            width: '100%', background: 'var(--bg-glass)',
            borderRadius: '16px', position: 'relative', display: 'flex', flexDirection: 'column',
            border: '1px solid var(--accent-dim)', backdropFilter: 'blur(16px)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)', marginTop: '8px'
          }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--accent)', padding: '12px 16px 0', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}><Edit2 size={12} /> Editing message...</div>
            <textarea
              ref={textareaRef}
              className="inline-edit-textarea"
              value={editValue}
              onChange={handleEditInput}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSaveEdit(); }
                if (e.key === 'Escape' && setEditingId) setEditingId(null);
              }}
              autoFocus
              style={{
                width: '100%', minHeight: '60px', background: 'transparent',
                border: 'none', color: 'var(--text-primary)', padding: '12px 16px',
                fontFamily: 'inherit', resize: 'none', outline: 'none',
                overflow: 'hidden', lineHeight: '1.6', fontSize: '0.98rem'
              }}
            />
            <div className="inline-edit-actions" style={{ padding: '8px 12px', display: 'flex', justifyContent: 'flex-end', gap: '8px', borderTop: '1px solid rgba(255, 255, 255, 0.05)' }}>
              <button
                onClick={() => setEditingId && setEditingId(null)}
                style={{
                  padding: '8px 20px',
                  background: 'var(--bg-secondary)',
                  borderRadius: '24px',
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                  border: '1px solid var(--border)',
                  fontSize: '0.9rem',
                  fontWeight: 500,
                  transition: 'all 0.2s'
                }}
                onMouseOver={(e) => e.target.style.background = 'var(--bg-glass-hover)'}
                onMouseOut={(e) => e.target.style.background = 'var(--bg-secondary)'}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={!editValue.trim() || editValue === message.content}
                style={{
                  padding: '8px 24px',
                  background: editValue.trim() && editValue !== message.content ? 'var(--accent)' : 'var(--bg-glass-hover)',
                  borderRadius: '24px',
                  color: '#fff',
                  cursor: 'pointer',
                  border: 'none',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  transition: 'all 0.2s',
                  opacity: (!editValue.trim() || editValue === message.content) ? 0.5 : 1,
                  boxShadow: editValue.trim() && editValue !== message.content ? 'var(--shadow-accent)' : 'none'
                }}
              >
                Save & Submit
              </button>
            </div>
          </div>
        )}

        {/* Floating Action Menu below AI bubble - Modern style */}
        {!isUser && !isLoading && (
          <div className="ai-floating-actions anim-scale-in">
            <button
              className={`action-btn ${message.liked === true ? 'active-like' : ''}`}
              onClick={() => handleLike(true)}
              title="Like"
            >
              <ThumbsUp size={13} />
            </button>
            <button
              className={`action-btn ${message.liked === false ? 'active-dislike' : ''}`}
              onClick={() => handleLike(false)}
              title="Dislike"
            >
              <ThumbsDown size={13} />
            </button>
            <button className="action-btn" onClick={handleRedo} title="Regenerate">
              <RotateCcw size={13} />
            </button>
            <button className={`action-btn ${copied ? 'copied' : ''}`} onClick={handleCopy} title="Copy">
              {copied ? <Check size={13} /> : <Copy size={13} />}
            </button>
            
            {isSpeaking ? (
              <button className="action-btn active-btn" onClick={handleStopSpeech} title="Stop reading">
                <VolumeX size={13} />
              </button>
            ) : (
              <button className="action-btn" onClick={handleListen} title="Read out loud">
                <Volume2 size={13} />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
