import React, { useState } from 'react';
import {
  Activity, Sliders, Palette, MessageSquare, HelpCircle,
  ChevronDown, ChevronUp, Send, Check, User, Sprout,
} from 'lucide-react';
import { useChat } from '../../context/ChatContext';
import { useTheme } from '../../context/ThemeContext';
import ThemePicker from '../sidebar/ThemePicker';
import './SettingsPage.css';

const FAQ = [
  { q: 'How does Koda work?', a: 'Koda is an AI chatbot that uses advanced language models to understand and respond to your messages. It can help with analysis, writing, coding, research, and much more.' },
  { q: 'What are Seeds?', a: 'Seeds are custom AI personas you build. You define a name, instructions, and optionally a knowledge base. Koda will follow those instructions when you chat through a seed.' },
  { q: 'Is my data stored?', a: 'All your data (chats, seeds, settings) is stored locally in your browser using localStorage. Nothing is sent to any server in this demo.' },
  { q: 'What models are available?', a: 'Koda offers three response modes — Fast (quick answers), Thinking (detailed & nuanced), and Deep Analysis (in-depth, thorough responses).' },
  { q: 'How do I use voice input?', a: 'Click the mic button in the chat input bar. Voice input uses the Web Speech API and works best in Chrome or Edge browsers.' },
];

const RESPONSE_STYLES = ['Balanced', 'Concise', 'Detailed', 'Friendly', 'Formal', 'Creative'];

export default function SettingsPage() {
  const { state, dispatch } = useChat();
  const { activeTheme } = useTheme();
  const [openFaq, setOpenFaq] = useState(null);
  const [userName, setUserName] = useState(state.user.name);
  const [responseStyle, setResponseStyle] = useState('Balanced');
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackSent, setFeedbackSent] = useState(false);
  const [activeTab, setActiveTab] = useState('activity');

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

  const TABS = [
    { id: 'activity', label: 'Activity', icon: Activity },
    { id: 'personalize', label: 'Personalize', icon: Sliders },
    { id: 'theme', label: 'Theme', icon: Palette },
    { id: 'feedback', label: 'Feedback', icon: MessageSquare },
    { id: 'help', label: 'Help', icon: HelpCircle },
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
                  <div className="activity-label">Seeds Created</div>
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
                <label className="field-label"><Sliders size={14} /> Response Style</label>
                <div className="style-grid">
                  {RESPONSE_STYLES.map(s => (
                    <button
                      key={s}
                      className={`style-btn ${responseStyle === s ? 'active' : ''}`}
                      onClick={() => setResponseStyle(s)}
                      id={`style-${s.toLowerCase()}`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div className="settings-field">
                <label className="field-label"><Sprout size={14} /> Seeds Configured</label>
                <div className="settings-stat">
                  <span className="stat-num">{state.seeds.length}</span> seed{state.seeds.length !== 1 ? 's' : ''} active
                </div>
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
    </div>
  );
}
