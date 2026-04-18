import React, { useState } from 'react';
import { X, User, Check } from 'lucide-react';
import { useChat } from '../../context/ChatContext';
import './ProfileModal.css';

export default function ProfileModal({ onClose }) {
  const { state, dispatch } = useChat();
  const [name, setName] = useState(state.user.name);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    dispatch({
      type: 'SET_USER',
      payload: { name, avatar: name.charAt(0).toUpperCase() },
    });
    setSaved(true);
    setTimeout(() => { setSaved(false); onClose(); }, 800);
  };

  return (
    <div className="modal-overlay anim-fade-in" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-card anim-scale-in" id="profile-modal">
        <div className="modal-header">
          <h2 className="modal-title">Manage Profile</h2>
          <button className="icon-btn" onClick={onClose}><X size={16} /></button>
        </div>

        <div className="modal-body">
          {/* Avatar */}
          <div className="profile-avatar-section">
            <div className="profile-avatar-large">
              {state.user.avatar}
            </div>
            <p className="avatar-hint">Your avatar is generated from your name initial</p>
          </div>

          <div className="modal-field">
            <label className="modal-label"><User size={13} /> Display Name</label>
            <input
              className="modal-input"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Enter your name"
              id="profile-name-input"
            />
          </div>
        </div>

        <div className="modal-footer">
          <button className="modal-cancel-btn" onClick={onClose}>Cancel</button>
          <button className={`modal-save-btn ${saved ? 'saved' : ''}`} onClick={handleSave} id="profile-save-btn">
            {saved ? <><Check size={14} /> Saved!</> : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
