import React, { useState, useRef, useEffect } from 'react';
import {
  Plus, Wrench, Mic, MicOff, Send, Zap, Brain, BarChart3,
  X, Image, FileText, Link, Globe, Code, Calculator, ChevronUp,
} from 'lucide-react';
import { useVoiceInput } from '../../hooks/useVoiceInput';
import { useChat } from '../../context/ChatContext';
import './ChatBox.css';

const MODELS = [
  { id: 'fast', label: 'Fast', icon: Zap, description: 'Quick responses' },
  { id: 'thinking', label: 'Thinking', icon: Brain, description: 'Thoughtful & detailed' },
  { id: 'deep', label: 'Deep Analysis', icon: BarChart3, description: 'In-depth analysis' },
];

const TOOLS = [
  { id: 'image', label: 'Image Generation', icon: Image },
  { id: 'web', label: 'Web Search', icon: Globe },
  { id: 'code', label: 'Code Runner', icon: Code },
  { id: 'calc', label: 'Calculator', icon: Calculator },
  { id: 'doc', label: 'Document Reader', icon: FileText },
  { id: 'link', label: 'Link Analyzer', icon: Link },
];

export default function ChatBox({ onSend, model, onModelChange, disabled = false, injectedText = '', fileSearchEnabled = true, webSearchEnabled = true }) {
  const { dispatch } = useChat();
  const [text, setText] = useState('');
  const [toolsOpen, setToolsOpen] = useState(false);
  const [modelOpen, setModelOpen] = useState(false);
  const [activeTools, setActiveTools] = useState([]);
  const [attachments, setAttachments] = useState([]);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);

  const { listening, toggle: toggleMic } = useVoiceInput(text, setText);

  useEffect(() => {
    if (injectedText) {
      setText(injectedText);
      textareaRef.current?.focus();
    }
  }, [injectedText]);

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (ta) {
      ta.style.height = 'auto';
      ta.style.height = Math.min(ta.scrollHeight, 180) + 'px';
    }
  }, [text]);

  // Global keydown listener to instantly redirect typing
  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      if (disabled) return;
      // Skip if already focused on an input
      const tag = document.activeElement?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || document.activeElement?.isContentEditable) return;

      // Skip command shortcuts
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      // If pressing a printable character (length 1), auto-focus the chatbox
      if (e.key.length === 1 && textareaRef.current) {
        textareaRef.current.focus();
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [disabled]);

  const handleBoxClick = (e) => {
    // If they clicked a button or attachment, let it handle its own click
    if (e.target.closest('button') || e.target.tagName?.toLowerCase() === 'input') return;
    textareaRef.current?.focus();
  };

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setText('');
    setAttachments([]);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setAttachments(p => [
      ...p,
      ...files.map(f => ({ id: `${f.name}_${Date.now()}`, name: f.name, type: f.type })),
    ]);

    // Auto-add to global inventory as well
    files.forEach(f => {
      dispatch({
        type: 'ADD_INVENTORY_ITEM',
        payload: {
          id: `inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          name: f.name,
          type: f.type,
          size: f.size,
          uploadedAt: Date.now(),
        },
      });
    });

    e.target.value = '';
  };

  const toggleTool = (id) => {
    setActiveTools(p => p.includes(id) ? p.filter(t => t !== id) : [...p, id]);
  };

  const currentModel = MODELS.find(m => m.id === model) || MODELS[0];

  return (
    <div className="chatbox-wrapper">
      {/* Tools panel — slides up above the bar */}
      {toolsOpen && (
        <div className="tools-panel anim-slide-up">
          <div className="tools-panel-header">
            <span>Tools</span>
            <button className="icon-btn" onClick={() => setToolsOpen(false)}><X size={14} /></button>
          </div>
          <div className="tools-grid">
            {TOOLS.map(tool => {
              const Icon = tool.icon;
              const active = activeTools.includes(tool.id);
              return (
                <button
                  key={tool.id}
                  className={`tool-chip ${active ? 'active' : ''}`}
                  onClick={() => toggleTool(tool.id)}
                  id={`tool-${tool.id}`}
                >
                  <Icon size={14} /> {tool.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Model picker panel */}
      {modelOpen && (
        <div className="model-panel anim-slide-up">
          {MODELS.map(m => {
            const Icon = m.icon;
            return (
              <button
                key={m.id}
                className={`model-option ${model === m.id ? 'active' : ''}`}
                onClick={() => { onModelChange(m.id); setModelOpen(false); }}
                id={`model-${m.id}`}
              >
                <div className="model-icon-wrap"><Icon size={15} /></div>
                <div>
                  <div className="model-label">{m.label}</div>
                  <div className="model-desc">{m.description}</div>
                </div>
                {model === m.id && <span className="model-check">✓</span>}
              </button>
            );
          })}
        </div>
      )}

      <div className={`chatbox ${disabled ? 'disabled' : ''}`} onClick={handleBoxClick}>
        {/* Attachments row */}
        {attachments.length > 0 && (
          <div className="attachments-row">
            {attachments.map(a => (
              <div key={a.id} className="attachment-chip">
                <FileText size={11} />
                <span>{a.name}</span>
                <button onClick={() => setAttachments(p => p.filter(x => x.id !== a.id))}>
                  <X size={10} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          className="chatbox-input"
          placeholder={listening ? 'Listening...' : 'Message Koda…'}
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
          disabled={disabled}
          id="chat-input"
        />

        {/* Bottom toolbar */}
        <div className="chatbox-toolbar">
          {/* Left */}
          <div className="toolbar-left">
            {fileSearchEnabled && (
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  hidden
                  onChange={handleFileChange}
                  id="file-upload-input"
                />
                <button
                  className="icon-btn toolbar-btn"
                  onClick={() => fileInputRef.current?.click()}
                  title="Attach file"
                  id="attach-btn"
                >
                  <Plus size={16} />
                </button>
              </>
            )}
            <button
              className={`toolbar-text-btn ${toolsOpen ? 'active' : ''}`}
              onClick={() => { setToolsOpen(o => !o); setModelOpen(false); }}
              id="tools-btn"
            >
              <Wrench size={13} />
              <span>Tools</span>
              {activeTools.length > 0 && (
                <span className="tools-badge">{activeTools.length}</span>
              )}
              <ChevronUp size={11} className={`chevron ${toolsOpen ? 'rotated' : ''}`} />
            </button>
          </div>

          {/* Right */}
          <div className="toolbar-right">
            <button
              className={`model-selector-btn ${modelOpen ? 'active' : ''}`}
              onClick={() => { setModelOpen(o => !o); setToolsOpen(false); }}
              id="model-selector-btn"
            >
              <currentModel.icon size={13} />
              <span>{currentModel.label}</span>
              <ChevronUp size={11} className={`chevron ${modelOpen ? 'rotated' : ''}`} />
            </button>

            <button
              className={`icon-btn toolbar-btn mic-btn ${listening ? 'listening' : ''}`}
              onClick={toggleMic}
              title={listening ? 'Stop listening' : 'Voice input'}
              id="mic-btn"
            >
              {listening ? <MicOff size={16} /> : <Mic size={16} />}
            </button>

            <button
              className={`send-btn ${text.trim() ? 'ready' : ''}`}
              onClick={handleSend}
              disabled={!text.trim() || disabled}
              id="send-btn"
            >
              <Send size={15} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
