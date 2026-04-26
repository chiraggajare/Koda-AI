import React, { useState } from 'react';
import {
  Activity, Sliders, Palette, MessageSquare, HelpCircle,
  ChevronDown, ChevronUp, Send, Check, User, Sprout,
  Brain, Plus, X, Trash2, BookOpen,
} from 'lucide-react';
import { useChat } from '../../context/ChatContext';
import { useTheme } from '../../context/ThemeContext';
import ThemePicker from '../sidebar/ThemePicker';
import './SettingsPage.css';

const FAQ = [
  { q: 'How does Koda work?', a: 'Koda is an AI chatbot that uses advanced language models to understand and respond to your messages. It can help with analysis, writing, coding, research, and much more.' },
  { q: 'What are Experts?', a: 'Experts are custom AI personas you build. You define a name, instructions, and optionally a knowledge base. Koda will follow those instructions when you chat through an expert.' },
  { q: 'Is my data stored?', a: 'All your data (chats, experts, settings) is stored locally in your browser using localStorage. Nothing is sent to any server in this demo.' },
  { q: 'What models are available?', a: 'Koda offers three response modes — Fast (quick answers), Thinking (detailed & nuanced), and Deep Analysis (in-depth, thorough responses).' },
  { q: 'How do I use voice input?', a: 'Click the mic button in the chat input bar. Voice input uses the Web Speech API and works best in Chrome or Edge browsers.' },
];



export default function SettingsPage() {
  const { state, dispatch } = useChat();
  const { activeTheme } = useTheme();
  const [openFaq, setOpenFaq] = useState(null);
  const [userName, setUserName] = useState(state.user.name);

  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackSent, setFeedbackSent] = useState(false);
  const [activeTab, setActiveTab] = useState('activity');

  // Personal context state
  const [memoryEnabled, setMemoryEnabled] = useState(true);
  const [instructions, setInstructions] = useState([]);
  const [instructionModalOpen, setInstructionModalOpen] = useState(false);
  const [instructionDraft, setInstructionDraft] = useState('');

  const totalMessages = state.conversations.reduce((sum, c) => sum + c.messages.length, 0);

  const handleSaveProfile = () => {
    dispatch({ type: 'SET_USER', payload: { name: userName, avatar: userName.charAt(0).toUpperCase() } });
  };

  const handleFeedback = () => {
    if (!feedbackText.trim()) return;
    setFeedbackSent(true);
    setFeedbackText('');
    setTimeout(() => setFeedbackSent(false), 3000);
  };

  const handleAddInstruction = () => {
    const text = instructionDraft.trim();
    if (!text) return;
    setInstructions(prev => [...prev, { id: Date.now(), text }]);
    setInstructionDraft('');
    setInstructionModalOpen(false);
  };

  const handleDeleteInstruction = (id) => {
    setInstructions(prev => prev.filter(i => i.id !== id));
  };

  const TABS = [
    { id: 'activity',  label: 'Activity',  icon: Activity },
    { id: 'personalize', label: 'Personalize', icon: Sliders },
    { id: 'context',   label: 'Personal Context', icon: Brain },
    { id: 'theme',     label: 'Theme',     icon: Palette },
    { id: 'feedback',  label: 'Feedback',  icon: MessageSquare },
    { id: 'help',      label: 'Help',      icon: HelpCircle },
  ];

  return (
    <div className="settings-page">
      <div className="settings-header">
        <h1 className="settings-title">Settings & Help</h1>
        <p className="settings-subtitle">Manage your preferences and get help</p>
      </div>

      <div className="settings-body">
        {/* Tabs */}
        <div className="settings-tabs">
          {TABS.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                className={`settings-tab ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
                id={`settings-tab-${tab.id}`}
              >
                <Icon size={16} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Panel */}
        <div className="settings-panel">

          {/* Activity */}
          {activeTab === 'activity' && (
            <div className="settings-section anim-fade-in">
              <h2 className="section-title">Your Activity</h2>
              <div className="activity-grid">
                <div className="activity-card">
                  <div className="activity-value">{state.conversations.length}</div>
                  <div className="activity-label">Total Conversations</div>
                </div>
                <div className="activity-card">
                  <div className="activity-value">{totalMessages}</div>
                  <div className="activity-label">Messages Sent</div>
                </div>
                <div className="activity-card">
                  <div className="activity-value">{state.seeds.length}</div>
                  <div className="activity-label">Experts Created</div>
                </div>
                <div className="activity-card">
                  <div className="activity-value">{state.inventory.length}</div>
                  <div className="activity-label">Files Uploaded</div>
                </div>
              </div>

              <h3 className="section-subtitle">Recent Chats</h3>
              <div className="recent-chats">
                {state.conversations.slice(0, 5).map(c => (
                  <div key={c.id} className="recent-chat-row">
                    <MessageSquare size={13} />
                    <span className="recent-chat-title">{c.title}</span>
                    <span className="recent-chat-msgs">{c.messages.length} msgs</span>
                  </div>
                ))}
                {state.conversations.length === 0 && (
                  <div className="empty-state">No conversations yet</div>
                )}
              </div>
            </div>
          )}

          {/* Personalize */}
          {activeTab === 'personalize' && (
            <div className="settings-section anim-fade-in">
              <h2 className="section-title">Personalization</h2>

              <div className="settings-field">
                <label className="field-label"><User size={14} /> Display Name</label>
                <div className="field-row">
                  <input
                    className="settings-input"
                    value={userName}
                    onChange={e => setUserName(e.target.value)}
                    placeholder="Your name"
                    id="settings-name-input"
                  />
                  <button className="field-save-btn" onClick={handleSaveProfile}>
                    <Check size={14} /> Save
                  </button>
                </div>
              </div>


              <div className="settings-field">
                <label className="field-label"><Sprout size={14} /> Experts Configured</label>
                <div className="settings-stat">
                  <span className="stat-num">{state.seeds.length}</span> expert{state.seeds.length !== 1 ? 's' : ''} active
                </div>
              </div>
            </div>
          )}

          {/* ── Personal Context ────────────────────────────── */}
          {activeTab === 'context' && (
            <div className="settings-section anim-fade-in">
              <h2 className="section-title">Personal Context</h2>

              {/* Memory toggle */}
              <div className="context-card">
                <div className="context-card-header">
                  <div className="context-card-icon memory">
                    <Brain size={18} />
                  </div>
                  <div className="context-card-info">
                    <h3 className="context-card-title">Memory</h3>
                    <p className="context-card-desc">
                      Koda AI learns from your past chats to understand more about you and personalise your experience.
                    </p>
                  </div>
                  {/* Toggle */}
                  <button
                    type="button"
                    className={`settings-toggle-btn ${memoryEnabled ? 'on' : 'off'}`}
                    onClick={() => setMemoryEnabled(e => !e)}
                    aria-label="Toggle memory"
                  >
                    <div className="settings-toggle-knob" />
                  </button>
                </div>

                {memoryEnabled && (
                  <div className="context-card-footer anim-fade-in">
                    <button
                      className="context-danger-btn"
                      onClick={() => {}}
                    >
                      <Trash2 size={13} /> Delete all memory data
                    </button>
                  </div>
                )}
              </div>

              {/* Instructions */}
              <div className="context-card">
                <div className="context-card-header">
                  <div className="context-card-icon instructions">
                    <BookOpen size={18} />
                  </div>
                  <div className="context-card-info">
                    <h3 className="context-card-title">Your Instructions for Koda AI</h3>
                    <p className="context-card-desc">
                      Customise how Koda responds to you by giving it instructions that apply to every conversation.
                    </p>
                  </div>
                  <button
                    className="context-add-btn"
                    onClick={() => setInstructionModalOpen(true)}
                    id="add-instruction-btn"
                  >
                    <Plus size={14} /> Add
                  </button>
                </div>

                {instructions.length > 0 && (
                  <div className="instructions-list">
                    {instructions.map(inst => (
                      <div key={inst.id} className="instruction-item">
                        <span className="instruction-text">{inst.text}</span>
                        <button
                          className="instruction-delete"
                          onClick={() => handleDeleteInstruction(inst.id)}
                          title="Remove instruction"
                        >
                          <X size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {instructions.length === 0 && (
                  <p className="context-empty">No instructions added yet.</p>
                )}
              </div>
            </div>
          )}

          {/* Theme */}
          {activeTab === 'theme' && (
            <div className="settings-section anim-fade-in">
              <h2 className="section-title">App Theme</h2>
              <p className="section-desc">Choose a color theme to personalize your Koda experience.</p>
              <div className="theme-picker-full">
                <ThemePicker />
              </div>
            </div>
          )}

          {/* Feedback */}
          {activeTab === 'feedback' && (
            <div className="settings-section anim-fade-in">
              <h2 className="section-title">Send Feedback</h2>
              <p className="section-desc">Have thoughts, ideas, or found a bug? Let us know!</p>
              <textarea
                className="feedback-textarea"
                placeholder="Share your feedback, suggestions, or report issues…"
                value={feedbackText}
                onChange={e => setFeedbackText(e.target.value)}
                rows={6}
                id="feedback-textarea"
              />
              <button
                className={`feedback-send-btn ${feedbackSent ? 'sent' : ''}`}
                onClick={handleFeedback}
                disabled={!feedbackText.trim()}
                id="feedback-send-btn"
              >
                {feedbackSent ? <><Check size={14} /> Feedback sent!</> : <><Send size={14} /> Send Feedback</>}
              </button>
            </div>
          )}

          {/* Help */}
          {activeTab === 'help' && (
            <div className="settings-section anim-fade-in">
              <h2 className="section-title">Help & FAQ</h2>
              <div className="faq-list">
                {FAQ.map((item, i) => (
                  <div key={i} className={`faq-item ${openFaq === i ? 'open' : ''}`}>
                    <button className="faq-question" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                      <span>{item.q}</span>
                      {openFaq === i ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                    </button>
                    {openFaq === i && (
                      <div className="faq-answer anim-slide-up">{item.a}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Add Instruction Modal ── */}
      {instructionModalOpen && (
        <div className="modal-overlay anim-fade-in" onClick={() => setInstructionModalOpen(false)}>
          <div className="modal-box anim-scale-in" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Add Instruction</h3>
              <button className="icon-btn" onClick={() => setInstructionModalOpen(false)}>
                <X size={16} />
              </button>
            </div>
            <p className="modal-desc">
              Tell Koda how you'd like it to behave, respond, or what to always keep in mind.
            </p>
            <textarea
              className="modal-textarea"
              placeholder="e.g. Always respond in a concise bullet-point format. Use technical language."
              value={instructionDraft}
              onChange={e => setInstructionDraft(e.target.value)}
              rows={5}
              autoFocus
              id="instruction-draft-input"
            />
            <div className="modal-actions">
              <button
                className="modal-cancel-btn"
                onClick={() => { setInstructionModalOpen(false); setInstructionDraft(''); }}
              >
                Cancel
              </button>
              <button
                className={`modal-submit-btn ${instructionDraft.trim() ? 'ready' : ''}`}
                onClick={handleAddInstruction}
                disabled={!instructionDraft.trim()}
                id="submit-instruction-btn"
              >
                <Check size={14} /> Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
