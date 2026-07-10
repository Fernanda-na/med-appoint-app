import React, { useState, useRef, useEffect } from 'react';
import { API_BASE_URL } from '../contexts/AuthContext';
import './AIChatbot.css';

interface ChatMessage {
  id: number;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

interface ChatbotSuggestion {
  text: string;
  icon: string;
}

export const AIChatbot: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 0,
      text: 'Bonjour ! Je suis l\'assistant IA de MedAppoint. Comment puis-je vous aider aujourd\'hui ?',
      sender: 'bot',
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ x: 20, y: 20 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [suggestions, setSuggestions] = useState<ChatbotSuggestion[]>([
    { text: 'Trouver un médecin', icon: '👨‍⚕️' },
    { text: 'Prendre rendez-vous', icon: '📅' },
    { text: 'Horaires de consultation', icon: '⏰' },
    { text: 'Annuler un rendez-vous', icon: '❌' },
  ]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatbotRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (text: string) => {
    if (!text.trim()) return;

    const userMessage: ChatMessage = {
      id: messages.length,
      text,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    setIsTyping(true);

    try {
      const response = await fetch(`${API_BASE_URL}/ai/chatbot`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
      });

      const data = await response.json();

      const botMessage: ChatMessage = {
        id: messages.length + 1,
        text: data.response,
        sender: 'bot',
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, botMessage]);

      if (data.suggestions) {
        setSuggestions(
          data.suggestions.map((s: string) => ({
            text: s,
            icon: getIconForSuggestion(s),
          }))
        );
      }
    } catch (error) {
      console.error('Chatbot error:', error);
      const errorMessage: ChatMessage = {
        id: messages.length + 1,
        text: 'Désolé, une erreur est survenue. Veuillez réessayer.',
        sender: 'bot',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const getIconForSuggestion = (text: string): string => {
    if (text.includes('médecin') || text.includes('trouver')) return '👨‍⚕️';
    if (text.includes('rendez-vous') || text.includes('prendre')) return '📅';
    if (text.includes('horaire') || text.includes('heure')) return '⏰';
    if (text.includes('annuler') || text.includes('modifier')) return '❌';
    return '💬';
  };

  const handleSuggestionClick = (suggestion: ChatbotSuggestion) => {
    handleSendMessage(suggestion.text);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (chatbotRef.current) {
      setIsDragging(true);
      const rect = chatbotRef.current.getBoundingClientRect();
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragOffset.x,
        y: e.clientY - dragOffset.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleDragStart = (e: React.DragEvent) => {
    e.preventDefault();
  };

  if (!isOpen) {
    return (
      <button 
        className="chatbot-toggle" 
        onClick={() => setIsOpen(true)}
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          zIndex: 1000,
        }}
      >
        <span className="chatbot-icon">🤖</span>
        <span className="chatbot-label">Assistant IA</span>
      </button>
    );
  }

  return (
    <div 
      ref={chatbotRef}
      className="chatbot-container chatbot-floating"
      style={{
        position: 'fixed',
        left: `${position.x}px`,
        top: `${position.y}px`,
        zIndex: 1000,
        cursor: isDragging ? 'grabbing' : 'default',
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onDragStart={handleDragStart}
      draggable={false}
    >
      <div className="chatbot-header" style={{ cursor: 'grab' }}>
        <div className="chatbot-title">
          <span className="chatbot-avatar">🤖</span>
          <div>
            <span className="chatbot-name">Assistant MedAppoint</span>
            <span className="chatbot-status">En ligne</span>
          </div>
        </div>
        <button className="chatbot-close" onClick={() => setIsOpen(false)}>
          ✕
        </button>
      </div>

      <div className="chatbot-messages">
        {messages.map((msg) => (
          <div key={msg.id} className={`message message-${msg.sender}`}>
            <div className="message-content">
              <span className="message-text">{msg.text}</span>
              <span className="message-time">{formatTime(msg.timestamp)}</span>
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="message message-bot">
            <div className="message-content">
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="chatbot-suggestions">
        {suggestions.map((suggestion, index) => (
          <button
            key={index}
            className="suggestion-chip"
            onClick={() => handleSuggestionClick(suggestion)}
          >
            <span className="suggestion-icon">{suggestion.icon}</span>
            <span className="suggestion-text">{suggestion.text}</span>
          </button>
        ))}
      </div>

      <div className="chatbot-input-area">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage(inputText);
          }}
        >
          <input
            type="text"
            className="chatbot-input"
            placeholder="Écrivez votre message..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={isTyping}
          />
          <button
            type="submit"
            className="chatbot-send"
            disabled={!inputText.trim() || isTyping}
          >
            ➤
          </button>
        </form>
      </div>
    </div>
  );
};
