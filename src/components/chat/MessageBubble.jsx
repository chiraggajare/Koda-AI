import React, { useState } from 'react';
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

export default function MessageBubble({ message, conversationId }) {
  const { dispatch, sendMessage, state, activeConversation } = useChat();
  const [copied, setCopied] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);

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
      const utt = new SpeechSynthesisUtterance(message.content);
      window.speechSynthesis.speak(utt);
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

      <div className="message-group">
        <div className={`message-bubble ${isUser ? 'user-bubble' : 'ai-bubble'}`}>
          {isLoading ? (
            <TypingIndicator />
          ) : (
            <div
              className="message-content"
              dangerouslySetInnerHTML={{ __html: renderMarkdown(message.content) }}
            />
          )}

          {/* User message hover actions */}
          {isUser && !isLoading && (
            <div className="user-message-actions anim-fade-in">
              <button className={`action-btn-sm ${copied ? 'copied' : ''}`} onClick={handleCopy} title="Copy">
                {copied ? <Check size={12} /> : <Copy size={12} />}
              </button>
              <button className="action-btn-sm" title="Edit" onClick={() => prompt('Edit message snippet coming soon:')}>
                <Edit2 size={12} />
              </button>
            </div>
          )}
        </div>

        {/* Action row — only for AI messages */}
        {!isUser && !isLoading && (
          <div className="message-actions anim-fade-in">
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
            <button className="action-btn" onClick={handleRedo} title="Redo">
              <RotateCcw size={13} />
            </button>
            <button className={`action-btn ${copied ? 'copied' : ''}`} onClick={handleCopy} title="Copy">
              {copied ? <Check size={13} /> : <Copy size={13} />}
            </button>
            <div className="action-more-wrap">
              <button
                className={`action-btn ${moreOpen ? 'active-btn' : ''}`}
                onClick={() => setMoreOpen(o => !o)}
                title="More"
              >
                <MoreHorizontal size={13} />
              </button>
              {moreOpen && (
                <div className="action-dropdown anim-scale-in">
                  <button onClick={() => { handleRedo(); setMoreOpen(false); }}>
                    <RotateCcw size={13} /> Recheck response
                  </button>
                  <button onClick={() => { handleListen(); setMoreOpen(false); }}>
                    <Volume2 size={13} /> Listen
                  </button>
                  <button onClick={() => { window.speechSynthesis.cancel(); setMoreOpen(false); }}>
                    <VolumeX size={13} /> Stop Speech
                  </button>
                  <button onClick={() => setMoreOpen(false)}>
                    <Share size={13} /> Export
                  </button>
                  <button onClick={() => setMoreOpen(false)}>
                    <Mail size={13} /> Draft in Gmail
                  </button>
                  <button className="danger" onClick={() => setMoreOpen(false)}>
                    <Flag size={13} /> Report
                  </button>
                  <div className="action-version">
                    {message.model && (
                      <>
                        <ModelIcon size={11} />
                        <span>Generated by {MODEL_LABELS[message.model] || 'Koda'}</span>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
