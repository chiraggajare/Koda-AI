import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Sprout, Upload, X, Zap, Brain, BarChart3,
  ArrowLeft, Save, Trash2, Send, Mic, MicOff,
  Paperclip, Wand2, Globe, FileSearch, MessageSquareText, Settings2,
} from 'lucide-react';
import { useChat } from '../../context/ChatContext';
import { useVoiceInput } from '../../hooks/useVoiceInput';
import './SeedBuilder.css';

const MODELS = [
  { id: 'fast', label: 'Fast', icon: Zap },
  { id: 'thinking', label: 'Thinking', icon: Brain },
  { id: 'deep', label: 'Deep Analysis', icon: BarChart3 },
];

const SEED_COLORS = [
  '#7c6aff', '#00ffc2', '#ff6b35', '#38bdf8', '#f472b6', '#818cf8',
  '#fbbf24', '#34d399', '#f43f5e', '#a78bfa',
];

const WELCOME_MSG = "Hey there! I'll help you build your own AI Expert! You can say something like, 'Research based on detoxification' or 'Herbs recommendation for healthy gut health'. What would you like to make?";

const mockPreviewResponses = [
  "Based on my instructions, I'll help you with that! Here's a thoughtful response tailored to your expert configuration...",
  "Great question! As configured by your expert, I'm focusing on providing specialized insights relevant to your use case.",
  "I can see you're looking for specialized assistance. Let me apply the knowledge base and instructions from this expert to give you the best answer.",
];

const mockCreateResponses = [
  "That sounds great! I can build an expert that specializes in exactly that. Let me configure the instructions for you — any specific tone or style you prefer?",
  "Excellent idea! I'll set up this expert with focused knowledge on that topic. Do you want it to be more conversational or more factual?",
  "Perfect! I'm configuring your expert now. Should it reference scientific sources, or keep responses practical and easy to understand?",
];

export default function SeedBuilder() {
  const { state, dispatch } = useChat();
  const navigate = useNavigate();
  const { id: editId } = useParams();

  const existing = editId ? state.seeds.find(s => s.id === editId) : null;

  const [activeTab, setActiveTab] = useState('chat'); // 'chat' | 'configure'
  const [form, setForm] = useState({
    name: existing?.name || '',
    description: existing?.description || '',
    instructions: existing?.instructions || '',
    model: existing?.model || 'fast',
    color: existing?.color || SEED_COLORS[0],
    knowledgeBase: existing?.knowledgeBase || [],
    capabilities: existing?.capabilities || { webSearch: false, fileSearch: false },
  });

  // Preview panel state (shared between tabs)
  const [previewMessages, setPreviewMessages] = useState([]);
  const [previewInput, setPreviewInput] = useState('');
  const [previewLoading, setPreviewLoading] = useState(false);

  // Chat-and-Create tab state
  const [createMessages, setCreateMessages] = useState([]);
  const [createInput, setCreateInput] = useState('');
  const [createLoading, setCreateLoading] = useState(false);
  const [createAttachments, setCreateAttachments] = useState([]);
  const createEndRef = useRef(null);
  const createFileRef = useRef(null);

  // Configure tab state
  const [errors, setErrors] = useState({});
  const [saved, setSaved] = useState(false);

  // Voice input hooks
  const { listening: isListening, toggle: toggleMicInstructions } = useVoiceInput(
    form.instructions, 
    (val) => update('instructions', val)
  );
  const { listening: isListeningCreate, toggle: toggleMicCreate } = useVoiceInput(
    createInput, 
    setCreateInput
  );
  const { listening: isListeningPreview, toggle: toggleMicPreview } = useVoiceInput(
    previewInput, 
    setPreviewInput
  );

  useEffect(() => {
    createEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [createMessages, createLoading]);

  const update = (key, val) => {
    setForm(f => ({ ...f, [key]: val }));
    setErrors(e => ({ ...e, [key]: undefined }));
  };

  const updateCapability = (key, val) => {
    setForm(f => ({ ...f, capabilities: { ...f.capabilities, [key]: val } }));
  };

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    update('knowledgeBase', [
      ...form.knowledgeBase,
      ...files.map(f => ({ id: `${f.name}_${Date.now()}`, name: f.name, type: f.type, size: f.size })),
    ]);
    e.target.value = '';
  };

  const removeFile = (id) => {
    update('knowledgeBase', form.knowledgeBase.filter(f => f.id !== id));
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Name is required';
    if (!form.instructions.trim()) e.instructions = 'Instructions are required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    const seed = {
      ...form,
      id: existing?.id || `seed_${Date.now()}`,
      createdAt: existing?.createdAt || Date.now(),
    };
    dispatch({ type: 'SAVE_SEED', payload: seed });
    setSaved(true);
    setTimeout(() => navigate('/experts'), 800);
  };

  const handleDelete = () => {
    if (existing && confirm('Delete this expert?')) {
      dispatch({ type: 'DELETE_SEED', payload: existing.id });
      navigate('/experts');
    }
  };

  // Preview panel send
  const handlePreviewSend = async () => {
    if (!previewInput.trim()) return;
    const userMsg = { id: Date.now(), role: 'user', content: previewInput };
    setPreviewMessages(m => [...m, userMsg]);
    setPreviewInput('');
    setPreviewLoading(true);
    const delay = form.model === 'fast' ? 700 : form.model === 'thinking' ? 1500 : 2500;
    await new Promise(r => setTimeout(r, delay));
    const resp = mockPreviewResponses[Math.floor(Math.random() * mockPreviewResponses.length)];
    setPreviewMessages(m => [...m, { id: Date.now() + 1, role: 'assistant', content: resp }]);
    setPreviewLoading(false);
  };

  // Chat-and-Create send
  const handleCreateSend = async () => {
    const text = createInput.trim();
    if (!text && createAttachments.length === 0) return;
    const userMsg = {
      id: Date.now(),
      role: 'user',
      content: text,
      attachments: createAttachments,
    };
    setCreateMessages(m => [...m, userMsg]);
    setCreateInput('');
    setCreateAttachments([]);
    setCreateLoading(true);
    await new Promise(r => setTimeout(r, 900 + Math.random() * 600));
    const resp = mockCreateResponses[Math.floor(Math.random() * mockCreateResponses.length)];
    setCreateMessages(m => [...m, { id: Date.now() + 1, role: 'assistant', content: resp }]);
    setCreateLoading(false);
  };

  const handleCreateAttach = (e) => {
    const files = Array.from(e.target.files);
    setCreateAttachments(a => [
      ...a,
      ...files.map(f => ({ id: `${f.name}_${Date.now()}`, name: f.name, type: f.type })),
    ]);
    e.target.value = '';
  };

  // Voice input logic removed and replaced by hooks above

  const selectedModel = MODELS.find(m => m.id === form.model) || MODELS[0];

  return (
    <div className="expert-builder-page">
      {/* ── Header ─────────────────────────────────── */}
      <div className="expert-builder-header">
        <button className="icon-btn" onClick={() => navigate('/experts')}>
          <ArrowLeft size={18} />
        </button>
        <div className="expert-builder-title">
          <Sprout size={18} style={{ color: form.color }} />
          <span>{existing ? 'Edit Expert' : 'Create New Expert'}</span>
        </div>

        {/* Segmented Control */}
        <div className="eb-segmented">
          <button
            className={`eb-seg-btn ${activeTab === 'chat' ? 'active' : ''}`}
            onClick={() => setActiveTab('chat')}
            id="eb-tab-chat"
          >
            <MessageSquareText size={14} />
            Chat & Create
          </button>
          <button
            className={`eb-seg-btn ${activeTab === 'configure' ? 'active' : ''}`}
            onClick={() => setActiveTab('configure')}
            id="eb-tab-configure"
          >
            <Settings2 size={14} />
            Configure
          </button>
        </div>

        <div className="expert-builder-actions">
          {existing && (
            <button className="pill-btn danger-btn" onClick={handleDelete}>
              <Trash2 size={13} /> Delete
            </button>
          )}
          <button
            className={`save-btn ${saved ? 'saved' : ''}`}
            onClick={handleSave}
            id="save-seed-btn"
          >
            <Save size={14} />
            {saved ? 'Saved!' : 'Save Expert'}
          </button>
        </div>
      </div>

      {/* ── Body ───────────────────────────────────── */}
      <div className="expert-builder-body">

        {/* ── LEFT PANEL ─────────────────────────── */}
        <div className="expert-left-panel">

          {/* ═══ CHAT & CREATE TAB ═══ */}
          {activeTab === 'chat' && (
            <div className="eb-chat-panel">
              {/* Welcome bubble */}
              <div className="eb-chat-messages">
                <div className="eb-welcome-bubble">
                  <div className="eb-welcome-avatar">
                    <Sprout size={16} style={{ color: form.color }} />
                  </div>
                  <div className="eb-welcome-text">{WELCOME_MSG}</div>
                </div>

                {createMessages.map(msg => (
                  <div key={msg.id} className={`eb-chat-msg ${msg.role}`}>
                    {msg.role === 'assistant' && (
                      <div className="eb-assistant-avatar">
                        <Sprout size={13} style={{ color: form.color }} />
                      </div>
                    )}
                    <div className="eb-chat-bubble">
                      {msg.attachments?.length > 0 && (
                        <div className="eb-attach-chips">
                          {msg.attachments.map(a => (
                            <span key={a.id} className="eb-attach-chip">
                              <Paperclip size={10} /> {a.name}
                            </span>
                          ))}
                        </div>
                      )}
                      {msg.content}
                    </div>
                  </div>
                ))}

                {createLoading && (
                  <div className="eb-chat-msg assistant">
                    <div className="eb-assistant-avatar">
                      <Sprout size={13} style={{ color: form.color }} />
                    </div>
                    <div className="eb-chat-bubble">
                      <div className="typing-indicator"><span /><span /><span /></div>
                    </div>
                  </div>
                )}
                <div ref={createEndRef} />
              </div>

              {/* Attachment chips */}
              {createAttachments.length > 0 && (
                <div className="eb-attachment-preview">
                  {createAttachments.map(a => (
                    <span key={a.id} className="eb-attach-chip">
                      <Paperclip size={10} /> {a.name}
                      <button onClick={() => setCreateAttachments(p => p.filter(x => x.id !== a.id))}>
                        <X size={9} />
                      </button>
                    </span>
                  ))}
                </div>
              )}

              {/* Input bar */}
              <div className="eb-chat-input-bar">
                <button
                  className="eb-chat-icon-btn"
                  title="Attach files"
                  onClick={() => createFileRef.current?.click()}
                >
                  <Paperclip size={16} />
                </button>
                <input
                  ref={createFileRef}
                  type="file"
                  multiple
                  hidden
                  onChange={handleCreateAttach}
                />
                <input
                  className="eb-chat-input"
                  placeholder="Describe your expert..."
                  value={createInput}
                  onChange={e => setCreateInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleCreateSend()}
                  id="create-chat-input"
                />
                <button 
                  className={`eb-chat-icon-btn ${isListeningCreate ? 'listening' : ''}`} 
                  title={isListeningCreate ? 'Stop listening' : 'Voice input'}
                  onClick={toggleMicCreate}
                >
                  {isListeningCreate ? <MicOff size={16} /> : <Mic size={16} />}
                </button>
                <button
                  className={`eb-send-btn ${(createInput.trim() || createAttachments.length) ? 'ready' : ''}`}
                  onClick={handleCreateSend}
                  disabled={!createInput.trim() && createAttachments.length === 0}
                >
                  <Send size={15} />
                </button>
              </div>
            </div>
          )}

          {/* ═══ CONFIGURE TAB ═══ */}
          {activeTab === 'configure' && (
            <div className="expert-editor">

              {/* 1. Name */}
              <div className={`expert-field ${errors.name ? 'has-error' : ''}`}>
                <label className="expert-label">Expert Name <span className="required">*</span></label>
                <input
                  className="expert-input"
                  placeholder="e.g. Python Tutor, Research Assistant…"
                  value={form.name}
                  onChange={e => update('name', e.target.value)}
                  id="seed-name-input"
                />
                {errors.name && <span className="error-msg">{errors.name}</span>}
              </div>

              {/* 2. Description */}
              <div className="expert-field">
                <label className="expert-label">Description</label>
                <input
                  className="expert-input"
                  placeholder="Briefly describe what this expert does…"
                  value={form.description}
                  onChange={e => update('description', e.target.value)}
                  id="seed-description-input"
                />
              </div>

              {/* 3. Color */}
              <div className="expert-field">
                <label className="expert-label">Expert Color</label>
                <div className="expert-color-row">
                  {SEED_COLORS.map(c => (
                    <button
                      key={c}
                      className={`color-dot ${form.color === c ? 'selected' : ''}`}
                      style={{ background: c }}
                      onClick={() => update('color', c)}
                      title={c}
                    />
                  ))}
                </div>
              </div>

              {/* 4. Instructions */}
              <div className={`expert-field ${errors.instructions ? 'has-error' : ''}`}>
                <label className="expert-label">Instructions <span className="required">*</span></label>
                <div className="instructions-wrapper">
                  <textarea
                    className="expert-textarea"
                    placeholder="You are a helpful assistant that specializes in… Always respond in… When the user asks about…"
                    value={form.instructions}
                    onChange={e => update('instructions', e.target.value)}
                    rows={6}
                    id="seed-instructions-input"
                  />
                  <div className="instructions-actions">
                    <button
                      className={`instr-action-btn ${isListening ? 'listening' : ''}`}
                      onClick={toggleMicInstructions}
                      title={isListening ? 'Stop listening' : 'Voice input'}
                      id="instructions-mic-btn"
                    >
                      {isListening ? <MicOff size={13} /> : <Mic size={13} />}
                      {isListening ? 'Stop' : 'Voice'}
                    </button>
                    <button
                      className="instr-action-btn refine"
                      title="Refine instructions with AI"
                      id="refine-ai-btn"
                    >
                      <Wand2 size={13} />
                      Refine by AI
                    </button>
                  </div>
                </div>
                {errors.instructions && <span className="error-msg">{errors.instructions}</span>}
              </div>

              {/* 5. Default Model */}
              <div className="expert-field">
                <label className="expert-label">Default Chatbot Version</label>
                <div className="expert-model-row">
                  {MODELS.map(m => {
                    const Icon = m.icon;
                    return (
                      <button
                        key={m.id}
                        className={`expert-model-btn ${form.model === m.id ? 'active' : ''}`}
                        onClick={() => update('model', m.id)}
                        id={`seed-model-${m.id}`}
                      >
                        <Icon size={14} /> {m.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 6. Knowledge Base */}
              <div className="expert-field">
                <label className="expert-label">Knowledge Base</label>
                <label className="kb-dropzone" htmlFor="kb-upload">
                  <Upload size={20} />
                  <span>Drag & drop or <u>click to upload</u></span>
                  <span className="kb-hint">Supports PDF, DOCX, TXT, PNG, JPG</span>
                  <input
                    id="kb-upload"
                    type="file"
                    multiple
                    hidden
                    accept=".pdf,.docx,.txt,.png,.jpg,.jpeg"
                    onChange={handleFileUpload}
                  />
                </label>
                {form.knowledgeBase.length > 0 && (
                  <div className="kb-files">
                    {form.knowledgeBase.map(f => (
                      <div key={f.id} className="kb-file-chip">
                        <span className="kb-file-name">{f.name}</span>
                        <button onClick={() => removeFile(f.id)}><X size={11} /></button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 7. Capabilities */}
              <div className="expert-field">
                <label className="expert-label">Capabilities</label>
                <div className="capabilities-list">
                  <label className="capability-row" htmlFor="cap-web-search">
                    <div className="capability-icon-wrap web">
                      <Globe size={15} />
                    </div>
                    <div className="capability-info">
                      <span className="capability-name">Web Search</span>
                      <span className="capability-desc">Allow the expert to fetch live, real-world information from the web.</span>
                    </div>
                    <div className="capability-toggle-wrap">
                      <input
                        id="cap-web-search"
                        type="checkbox"
                        className="capability-checkbox"
                        checked={form.capabilities.webSearch}
                        onChange={e => updateCapability('webSearch', e.target.checked)}
                      />
                      <span className={`capability-toggle ${form.capabilities.webSearch ? 'on' : ''}`} />
                    </div>
                  </label>

                  <label className="capability-row" htmlFor="cap-file-search">
                    <div className="capability-icon-wrap file">
                      <FileSearch size={15} />
                    </div>
                    <div className="capability-info">
                      <span className="capability-name">File Search</span>
                      <span className="capability-desc">Allow users to upload files (documents, images, audio, video) in chat.</span>
                    </div>
                    <div className="capability-toggle-wrap">
                      <input
                        id="cap-file-search"
                        type="checkbox"
                        className="capability-checkbox"
                        checked={form.capabilities.fileSearch}
                        onChange={e => updateCapability('fileSearch', e.target.checked)}
                      />
                      <span className={`capability-toggle ${form.capabilities.fileSearch ? 'on' : ''}`} />
                    </div>
                  </label>
                </div>
              </div>

            </div>
          )}
        </div>

        {/* ── RIGHT: Preview Panel (always visible) ── */}
        <div className="expert-preview">
          <div className="preview-header">
            <div className="preview-title">
              <div className="preview-dot" style={{ background: form.color }} />
              <span>{form.name || 'Expert Preview'}</span>
            </div>
            <div className="preview-model-badge">
              <selectedModel.icon size={11} /> {selectedModel.label}
            </div>
          </div>

          <div className="preview-messages">
            {previewMessages.length === 0 && (
              <div className="preview-empty">
                <Sprout size={28} style={{ color: form.color, opacity: 0.6 }} />
                <p>Send a message to preview how your expert responds</p>
              </div>
            )}
            {previewMessages.map(msg => (
              <div key={msg.id} className={`preview-msg ${msg.role}`}>
                <div className="preview-bubble">{msg.content}</div>
              </div>
            ))}
            {previewLoading && (
              <div className="preview-msg assistant">
                <div className="preview-bubble">
                  <div className="typing-indicator"><span /><span /><span /></div>
                </div>
              </div>
            )}
          </div>

          <div className="preview-input-row">
            <input
              className="preview-input"
              placeholder="Test your expert…"
              value={previewInput}
              onChange={e => setPreviewInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handlePreviewSend()}
              id="preview-input"
            />
            <button 
              className={`preview-icon-btn ${isListeningPreview ? 'listening' : ''}`} 
              title={isListeningPreview ? 'Stop listening' : 'Voice input'}
              onClick={toggleMicPreview}
            >
              {isListeningPreview ? <MicOff size={16} /> : <Mic size={16} />}
            </button>
            <button
              className={`preview-send ${previewInput.trim() ? 'ready' : ''}`}
              onClick={handlePreviewSend}
              disabled={!previewInput.trim() || previewLoading}
            >
              <Send size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
