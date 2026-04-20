import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ArrowRight } from 'lucide-react';
import { useChat } from '../../context/ChatContext';
import Navbar from '../layout/Navbar';
import ChatBox from '../chat/ChatBox';
import './LandingPage.css';

const SUGGESTIONS = [
  'Explain quantum computing in simple terms',
  'Write a Python script to scrape a website',
  'Help me plan a 7-day travel itinerary',
  'What are the best practices for React architecture?',
];

export default function LandingPage() {
  const { state, dispatch, sendMessage } = useChat();
  const navigate = useNavigate();
  const [model, setModel] = useState('fast');
  const [injectedText, setInjectedText] = useState('');

  const handleSend = (text) => {
    dispatch({ type: 'NEW_CONVERSATION' });
    navigate('/chat', { state: { initialMessage: text, model } });
  };

  const handleSuggestion = (s) => {
    setInjectedText(s);
    setTimeout(() => setInjectedText(''), 50);
  };

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? 'Good morning' :
      hour < 18 ? 'Good afternoon' :
        'Good evening';

  return (
    <div className="landing-page">
      <Navbar variant="landing" />

      <div className="landing-content">
        {/* Greeting */}
        <div className="landing-greeting anim-fade-in-up">
          <div className="greeting-icon">
            <Sparkles size={28} />
          </div>
          <h1 className="greeting-text">
            {greeting}, <span className="greeting-name">{state.user.name}</span>
          </h1>
          <p className="greeting-sub">How can Koda help you today?</p>
        </div>

        {/* ChatBox */}
        <div className="landing-chatbox anim-fade-in-up" style={{ animationDelay: '0.1s' }}>
          <ChatBox onSend={handleSend} model={model} onModelChange={setModel} injectedText={injectedText} />
        </div>

        {/* Suggestions */}
        <div className="landing-suggestions anim-fade-in-up" style={{ animationDelay: '0.2s' }}>
          {SUGGESTIONS.map((s, i) => (
            <button
              key={i}
              className="suggestion-chip"
              onClick={() => handleSuggestion(s)}
              id={`suggestion-${i}`}
            >
              <span>{s}</span>
              <ArrowRight size={13} className="suggestion-arrow" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
