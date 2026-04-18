import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Sprout, Upload, X, Zap, Brain, BarChart3, Plus,
  ArrowLeft, Save, Trash2, Send,
} from 'lucide-react';
import { useChat } from '../../context/ChatContext';
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

const mockPreviewResponses = [
  "Based on my instructions, I'll help you with that! Here's a thoughtful response tailored to your seed configuration...",
  "Great question! As configured by your seed, I'm focusing on providing specialized insights relevant to your use case.",
  "I can see you're looking for specialized assistance. Let me apply the knowledge base and instructions from this seed to give you the best answer.",
];

export default function SeedBuilder() {
  const { state, dispatch } = useChat();
  const navigate = useNavigate();
  const { id: editId } = useParams();

  const existing = editId ? state.seeds.find(s => s.id === editId) : null;

  const [form, setForm] = useState({
    name: existing?.name || '',
    description: existing?.description || '',
    instructions: existing?.instructions || '',
    model: existing?.model || 'fast',
    color: existing?.color || SEED_COLORS[0],
    knowledgeBase: existing?.knowledgeBase || [],
  });

  const [previewMessages, setPreviewMessages] = useState([]);
  const [previewInput, setPreviewInput] = useState('');
  const [previewLoading, setPreviewLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [saved, setSaved] = useState(false);

  const update = (key, val) => {
    setForm(f => ({ ...f, [key]: val }));
    setErrors(e => ({ ...e, [key]: undefined }));
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
    setTimeout(() => navigate('/seeds'), 800);
  };

  const handlePreviewSend = async () => {
    if (!previewInput.trim()) return;
    const userMsg = { id: Date.now(), role: 'user', content: previewInput };
    setPreviewMessages(m => [...m, userMsg]);
    setPreviewInput('');
    setPreviewLoading(true);

    const delay = form.model === 'fast' ? 700 : form.model === 'thinking' ? 1500 : 2500;
    await new Promise(r => setTimeout(r, delay));

    const resp = mockPreviewResponses[Math.floor(Math.random() * mockPreviewResponses.length)];
    setPreviewMessages(m => [
      ...m,
      { id: Date.now() + 1, role: 'assistant', content: resp },
    ]);
    setPreviewLoading(false);
  };

  const handleDelete = () => {
    if (existing && confirm('Delete this seed?')) {
      dispatch({ type: 'DELETE_SEED', payload: existing.id });
      navigate('/seeds');
    }
  };

  const selectedModel = MODELS.find(m => m.id === form.model) || MODELS[0];

  return (
    <div className="seed-builder-page">
      {/* Header */}
      <div className="seed-builder-header">
        <button className="icon-btn" onClick={() => navigate('/seeds')}>
          <ArrowLeft size={18} />
        </button>
        <div className="seed-builder-title">
          <Sprout size={18} style={{ color: form.color }} />
          <span>{existing ? 'Edit Seed' : 'Create New Seed'}</span>
        </div>
        <div className="seed-builder-actions">
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
            {saved ? 'Saved!' : 'Save Seed'}
          </button>
        </div>
      </div>

      <div className="seed-builder-body">
        {/* Editor column */}
        <div className="seed-editor">

          {/* 1. Name */}
          <div className={`seed-field ${errors.name ? 'has-error' : ''}`}>
            <label className="seed-label">Seed Name <span className="required">*</span></label>
            <input
              className="seed-input"
              placeholder="e.g. Python Tutor, Research Assistant…"
              value={form.name}
              onChange={e => update('name', e.target.value)}
              id="seed-name-input"
            />
            {errors.name && <span className="error-msg">{errors.name}</span>}
          </div>

          {/* 2. Description */}
          <div className="seed-field">
            <label className="seed-label">Description</label>
            <input
              className="seed-input"
              placeholder="Briefly describe what this seed does…"
              value={form.description}
              onChange={e => update('description', e.target.value)}
              id="seed-description-input"
            />
          </div>

          {/* Color */}
          <div className="seed-field">
            <label className="seed-label">Seed Color</label>
            <div className="seed-color-row">
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

          {/* 3. Instructions */}
          <div className={`seed-field ${errors.instructions ? 'has-error' : ''}`}>
            <label className="seed-label">Instructions <span className="required">*</span></label>
            <textarea
              className="seed-textarea"
              placeholder="You are a helpful assistant that specializes in… Always respond in… When the user asks about…"
              value={form.instructions}
              onChange={e => update('instructions', e.target.value)}
              rows={6}
              id="seed-instructions-input"
            />
            {errors.instructions && <span className="error-msg">{errors.instructions}</span>}
          </div>

          {/* 4. Default Model */}
          <div className="seed-field">
            <label className="seed-label">Default Chatbot Version</label>
            <div className="seed-model-row">
              {MODELS.map(m => {
                const Icon = m.icon;
                return (
                  <button
                    key={m.id}
                    className={`seed-model-btn ${form.model === m.id ? 'active' : ''}`}
                    onClick={() => update('model', m.id)}
                    id={`seed-model-${m.id}`}
                  >
                    <Icon size={14} /> {m.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 5. Knowledge Base */}
          <div className="seed-field">
            <label className="seed-label">Knowledge Base</label>
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
                    <button onClick={() => removeFile(f.id)}>
                      <X size={11} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Preview column */}
        <div className="seed-preview">
          <div className="preview-header">
            <div className="preview-title">
              <div className="preview-dot" style={{ background: form.color }} />
              <span>{form.name || 'Seed Preview'}</span>
            </div>
            <div className="preview-model-badge">
              <selectedModel.icon size={11} /> {selectedModel.label}
            </div>
          </div>

          <div className="preview-messages">
            {previewMessages.length === 0 && (
              <div className="preview-empty">
                <Sprout size={28} style={{ color: form.color, opacity: 0.6 }} />
                <p>Send a message to preview how your seed responds</p>
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
                  <div className="typing-indicator">
                    <span /><span /><span />
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="preview-input-row">
            <input
              className="preview-input"
              placeholder="Test your seed…"
              value={previewInput}
              onChange={e => setPreviewInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handlePreviewSend()}
              id="preview-input"
            />
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
