import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Sparkles, ArrowRight, Sprout } from 'lucide-react';
import { useChat } from '../../context/ChatContext';
import Navbar from '../layout/Navbar';
import ChatBox from '../chat/ChatBox';
import MessageBubble from '../chat/MessageBubble';
import './ChatPage.css';
import '../pages/LandingPage.css'; // ensure Landing styles are loaded

const SUGGESTIONS = [
  'Explain quantum computing in simple terms',
  'Write a Python script to scrape a website',
  'Help me plan a 7-day travel itinerary',
  'What are the best practices for React architecture?',
];

export default function ChatPage() {
  const { state, dispatch, sendMessage, activeConversation } = useChat();
  const navigate = useNavigate();
  const location = useLocation();
  const bottomRef = useRef(null);
  const [model, setModel] = useState('fast');
  const initialSent = useRef(false);

  // Send initial message if passed via state
  useEffect(() => {
    if (activeConversation && location.state?.initialMessage && !initialSent.current) {
      initialSent.current = true;
      sendMessage(activeConversation.id, location.state.initialMessage, location.state.model || 'fast');
    }
  }, [activeConversation?.id]);

  // Redirect to landing if no active conversation
  useEffect(() => {
    if (!activeConversation) {
      navigate('/');
    }
  }, [activeConversation, navigate]);

  // Sync model with conversation
  useEffect(() => {
    if (activeConversation?.model) setModel(activeConversation.model);
  }, [activeConversation?.id]);

  // Auto-scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeConversation?.messages?.length]);

  if (!activeConversation) return null;

  const handleSend = (text) => {
    sendMessage(activeConversation.id, text, model);
  };

  const handleModelChange = (m) => {
    setModel(m);
    dispatch({ type: 'SET_MODEL', payload: { conversationId: activeConversation.id, model: m } });
  };

  const isLoading = activeConversation.messages.some(m => m.loading);

  return (
    <div className="chat-page">
      <Navbar variant="chat" />

      <div className="chat-area">
        {activeConversation.messages.length === 0 && (
          <div className="landing-content anim-fade-in" style={{ padding: '20px 16px', justifyContent: 'center' }}>
            {activeConversation.seedId ? (
              <div className="landing-greeting anim-fade-in-up">
                <div className="greeting-icon">
                  <Sprout size={28} />
                </div>
                <h1 className="greeting-text">
                  Chatting with <strong style={{ color: 'var(--accent)' }}>{state.seeds.find(s => s.id === activeConversation.seedId)?.name || 'Seed'}</strong>
                </h1>
                <p className="greeting-sub">This chat is powered by your custom Seed persona.</p>
              </div>
            ) : (
              <div className="landing-greeting anim-fade-in-up">
                <div className="greeting-icon">
                  <Sparkles size={28} />
                </div>
                <h1 className="greeting-text">
                  Good day, <span className="greeting-name">{state.user.name}</span>
                </h1>
                <p className="greeting-sub">How can Koda help you today?</p>
              </div>
            )}

            <div className="landing-suggestions anim-fade-in-up" style={{ animationDelay: '0.1s', marginTop: '20px' }}>
              {SUGGESTIONS.map((s, i) => (
                <button key={i} className="suggestion-chip" onClick={() => handleSend(s)}>
                  <span>{s}</span>
                  <ArrowRight size={13} className="suggestion-arrow" />
                </button>
              ))}
            </div>
          </div>
        )}

        {activeConversation.messages.map(message => (
          <MessageBubble
            key={message.id}
            message={message}
            conversationId={activeConversation.id}
          />
        ))}
        <div ref={bottomRef} style={{ height: '80px' }} />
      </div>

      <div className="chat-input-area">
        <ChatBox
          onSend={handleSend}
          model={model}
          onModelChange={handleModelChange}
          disabled={isLoading}
        />
        <p className="chat-disclaimer">
          <em>Koda is an AI and can make mistakes. Verify important information.</em>
        </p>
      </div>
    </div>
  );
}
