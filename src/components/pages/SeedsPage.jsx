import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Sprout, Edit2, Trash2, Zap, Brain, BarChart3, MessageSquare, Globe2, Users } from 'lucide-react';
import { useChat } from '../../context/ChatContext';
import './SeedsPage.css';

const MODEL_ICONS = { fast: Zap, thinking: Brain, deep: BarChart3 };
const MODEL_LABELS = { fast: 'Fast', thinking: 'Thinking', deep: 'Deep Analysis' };

export default function SeedsPage() {
  const { state, dispatch } = useChat();
  const navigate = useNavigate();

  const handleDelete = (id) => {
    if (confirm('Delete this expert?')) {
      dispatch({ type: 'DELETE_SEED', payload: id });
    }
  };

  const handleStartChat = (seed) => {
    dispatch({ type: 'NEW_CONVERSATION', payload: { seedId: seed.id } });
    navigate('/chat');
  };

  return (
    <div className="experts-page">
      {/* ── Header ─────────────────────────────── */}
      <div className="experts-header">
        <div className="experts-header-left">
          <Sprout size={22} style={{ color: 'var(--accent)' }} />
          <div>
            <h1 className="experts-title">Experts</h1>
            <p className="experts-subtitle">Custom AI personas and specialized assistants</p>
          </div>
        </div>
        <button className="create-expert-btn" onClick={() => navigate('/experts/new')} id="create-seed-btn">
          <Plus size={15} /> Create Expert
        </button>
      </div>

      {/* ── My Experts ─────────────────────────── */}
      {state.seeds.length === 0 ? (
        <div className="experts-empty anim-fade-in">
          <div className="experts-empty-icon">
            <Sprout size={36} />
          </div>
          <h2>No experts yet</h2>
          <p>Create your first expert to build a custom AI assistant with specialized instructions and knowledge.</p>
          <button className="create-expert-btn" onClick={() => navigate('/experts/new')}>
            <Plus size={15} /> Create your first expert
          </button>
        </div>
      ) : (
        <div className="experts-grid">
          {state.seeds.map(seed => {
            const ModelIcon = MODEL_ICONS[seed.model] || Zap;
            return (
              <div key={seed.id} className="expert-card anim-fade-in-up glass-card">
                <div className="expert-card-header">
                  <div className="expert-card-avatar" style={{ background: seed.color || 'var(--accent)' }}>
                    <Sprout size={20} color="white" />
                  </div>
                  <div className="expert-card-info">
                    <h3 className="expert-card-name">{seed.name}</h3>
                    <div className="expert-card-model">
                      <ModelIcon size={11} />
                      <span>{MODEL_LABELS[seed.model] || 'Fast'}</span>
                    </div>
                  </div>
                </div>

                {seed.description && (
                  <p className="expert-card-desc">{seed.description}</p>
                )}

                {/* Capability badges */}
                {(seed.capabilities?.webSearch || seed.capabilities?.fileSearch) && (
                  <div className="expert-card-caps">
                    {seed.capabilities?.webSearch && (
                      <span className="cap-badge web"><Globe2 size={10} /> Web</span>
                    )}
                    {seed.capabilities?.fileSearch && (
                      <span className="cap-badge file"><MessageSquare size={10} /> Files</span>
                    )}
                  </div>
                )}

                {seed.knowledgeBase?.length > 0 && (
                  <div className="expert-card-kb">
                    <span className="badge">{seed.knowledgeBase.length} file{seed.knowledgeBase.length > 1 ? 's' : ''}</span>
                  </div>
                )}

                <div className="expert-card-actions">
                  <button
                    className="expert-action-btn primary"
                    onClick={() => handleStartChat(seed)}
                  >
                    <MessageSquare size={13} /> Chat
                  </button>
                  <button
                    className="expert-action-btn"
                    onClick={() => navigate(`/experts/${seed.id}`)}
                  >
                    <Edit2 size={13} /> Edit
                  </button>
                  <button
                    className="expert-action-btn danger"
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

      {/* ── Explore Experts ────────────────────── */}
      <div className="explore-section anim-fade-in">
        <div className="explore-section-header">
          <div className="explore-section-title-wrap">
            <div className="explore-section-icon">
              <Users size={18} />
            </div>
            <div>
              <h2 className="explore-section-title">Explore Experts</h2>
              <p className="explore-section-subtitle">Experts created by the community — available for everyone to use.</p>
            </div>
          </div>
        </div>

        <div className="explore-empty-state">
          <div className="explore-empty-graphic">
            <div className="explore-orb orb-1" />
            <div className="explore-orb orb-2" />
            <div className="explore-orb orb-3" />
            <Globe2 size={32} style={{ color: 'var(--accent)', opacity: 0.7, position: 'relative', zIndex: 1 }} />
          </div>
          <p className="explore-empty-label">More experts coming soon.</p>
          <p className="explore-empty-sub">Community experts will appear here once the platform is ready.</p>
        </div>
      </div>
    </div>
  );
}
