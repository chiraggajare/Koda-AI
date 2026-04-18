import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Sprout, Edit2, Trash2, Zap, Brain, BarChart3, MessageSquare } from 'lucide-react';
import { useChat } from '../../context/ChatContext';
import './SeedsPage.css';

const MODEL_ICONS = { fast: Zap, thinking: Brain, deep: BarChart3 };
const MODEL_LABELS = { fast: 'Fast', thinking: 'Thinking', deep: 'Deep Analysis' };

export default function SeedsPage() {
  const { state, dispatch } = useChat();
  const navigate = useNavigate();

  const handleDelete = (id) => {
    if (confirm('Delete this seed?')) {
      dispatch({ type: 'DELETE_SEED', payload: id });
    }
  };

  const handleStartChat = (seed) => {
    dispatch({ type: 'NEW_CONVERSATION', payload: { seedId: seed.id } });
    navigate('/chat');
  };

  return (
    <div className="seeds-page">
      <div className="seeds-header">
        <div className="seeds-header-left">
          <Sprout size={22} style={{ color: 'var(--accent)' }} />
          <div>
            <h1 className="seeds-title">Seeds</h1>
            <p className="seeds-subtitle">Custom AI personas and specialized assistants</p>
          </div>
        </div>
        <button className="create-seed-btn" onClick={() => navigate('/seeds/new')} id="create-seed-btn">
          <Plus size={15} /> Create Seed
        </button>
      </div>

      {state.seeds.length === 0 ? (
        <div className="seeds-empty anim-fade-in">
          <div className="seeds-empty-icon">
            <Sprout size={36} />
          </div>
          <h2>No seeds yet</h2>
          <p>Create your first seed to build a custom AI assistant with specialized instructions and knowledge.</p>
          <button className="create-seed-btn" onClick={() => navigate('/seeds/new')}>
            <Plus size={15} /> Create your first seed
          </button>
        </div>
      ) : (
        <div className="seeds-grid">
          {state.seeds.map(seed => {
            const ModelIcon = MODEL_ICONS[seed.model] || Zap;
            return (
              <div key={seed.id} className="seed-card anim-fade-in-up glass-card">
                <div className="seed-card-header">
                  <div className="seed-card-avatar" style={{ background: seed.color || 'var(--accent)' }}>
                    <Sprout size={20} color="white" />
                  </div>
                  <div className="seed-card-info">
                    <h3 className="seed-card-name">{seed.name}</h3>
                    <div className="seed-card-model">
                      <ModelIcon size={11} />
                      <span>{MODEL_LABELS[seed.model] || 'Fast'}</span>
                    </div>
                  </div>
                </div>

                {seed.description && (
                  <p className="seed-card-desc">{seed.description}</p>
                )}

                {seed.knowledgeBase?.length > 0 && (
                  <div className="seed-card-kb">
                    <span className="badge">{seed.knowledgeBase.length} file{seed.knowledgeBase.length > 1 ? 's' : ''}</span>
                  </div>
                )}

                <div className="seed-card-actions">
                  <button
                    className="seed-action-btn primary"
                    onClick={() => handleStartChat(seed)}
                  >
                    <MessageSquare size={13} /> Chat
                  </button>
                  <button
                    className="seed-action-btn"
                    onClick={() => navigate(`/seeds/${seed.id}`)}
                  >
                    <Edit2 size={13} /> Edit
                  </button>
                  <button
                    className="seed-action-btn danger"
                    onClick={() => handleDelete(seed.id)}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
