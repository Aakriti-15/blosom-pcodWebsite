import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { cycleAPI, symptomAPI } from '../utils/api';
import { format } from 'date-fns';
import './Chatbot.css';

// ── Suggestion prompts ───────────────────────────
const SUGGESTIONS = [
  '🌙 Why is my cycle irregular?',
  '📊 What do my symptoms say about my health?',
  '🥗 What foods help with PCOD?',
  '⚡ Why am I always tired?',
  '💊 How do I manage PCOD naturally?',
  '📅 When is my next period?',
];

// ── Format time ──────────────────────────────────
const formatTime = (date) =>
  date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

// ── Main Component ───────────────────────────────
const Chatbot = () => {
  const { user } = useAuth();

  const [messages,  setMessages]  = useState([]);
  const [input,     setInput]     = useState('');
  const [loading,   setLoading]   = useState(false);
  const [userData,  setUserData]  = useState(null);

  const messagesEndRef = useRef(null);
  const textareaRef    = useRef(null);

  // ── Scroll to bottom ──
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => { scrollToBottom(); }, [messages]);

  // ── Fetch user's health data ──
  const fetchUserData = useCallback(async () => {
    try {
      const [cycleRes, symptomRes, statsRes] = await Promise.all([
        cycleAPI.getAll({ limit: 6 }),
        symptomAPI.getAll({ limit: 10 }),
        symptomAPI.getStats({ days: 30 }),
      ]);

      setUserData({
        cycles:       cycleRes.data.cycles       || [],
        prediction:   cycleRes.data.prediction,
        cycleStats:   cycleRes.data,
        recentLogs:   symptomRes.data.logs       || [],
        symptomStats: statsRes.data.stats,
      });
    } catch (err) {
      console.error('Failed to fetch user data:', err);
    }
  }, []);

  useEffect(() => { fetchUserData(); }, [fetchUserData]);

  // ── Build system prompt with user data ──
  const buildSystemPrompt = () => {
    const name = user?.name || 'the user';
    const hasPCOD = user?.healthProfile?.diagnosedWithPCOD;

    let dataContext = '';

    if (userData) {
      const { cycles, prediction, symptomStats, recentLogs } = userData;

      // Cycle data
      if (cycles.length > 0) {
        const avgCycle = cycles
          .filter((c) => c.cycleLength)
          .map((c) => c.cycleLength);
        const avg = avgCycle.length
          ? Math.round(avgCycle.reduce((a, b) => a + b, 0) / avgCycle.length)
          : null;

        dataContext += `\nCYCLE DATA:
- Total cycles logged: ${cycles.length}
- Average cycle length: ${avg ? `${avg} days` : 'Not enough data'}
- Last period: ${cycles[0] ? format(new Date(cycles[0].startDate), 'MMMM d, yyyy') : 'Unknown'}
- Flow patterns: ${cycles.map((c) => c.flowIntensity).join(', ')}
- Irregular cycles: ${cycles.filter((c) => c.cycleLength && (c.cycleLength < 21 || c.cycleLength > 35)).length}`;

        if (prediction) {
          dataContext += `\n- Next predicted period: ${format(new Date(prediction.predictedStartDate), 'MMMM d, yyyy')} (${prediction.confidence} confidence)`;
        }
      } else {
        dataContext += '\nCYCLE DATA: No cycles logged yet.';
      }

      // Symptom data
      if (symptomStats?.topSymptoms?.length > 0) {
        dataContext += `\n\nSYMPTOM DATA (last 30 days):
- Total logs: ${symptomStats.totalLogsInPeriod}
- Average energy: ${symptomStats.averageEnergyLevel}/10
- Average sleep: ${symptomStats.averageSleepHours} hours
- Top symptoms: ${symptomStats.topSymptoms.slice(0, 5).map((s) => `${s.name.replace(/_/g, ' ')} (${s.frequency}% frequency, severity ${s.averageSeverity}/5)`).join(', ')}
- Mood distribution: ${Object.entries(symptomStats.moodDistribution || {}).map(([m, c]) => `${m}: ${c} days`).join(', ')}`;
      } else {
        dataContext += '\nSYMPTOM DATA: No symptoms logged yet.';
      }

      // Recent logs
      if (recentLogs.length > 0) {
        dataContext += `\n\nRECENT LOGS:`;
        recentLogs.slice(0, 3).forEach((log) => {
          dataContext += `\n- ${format(new Date(log.date), 'MMM d')}: mood=${log.mood}, energy=${log.energyLevel}/10, sleep=${log.sleepHours}h, symptoms=${log.symptoms?.map((s) => s.name).join(', ') || 'none'}`;
        });
      }
    }

    return `You are Blossom AI, a warm, knowledgeable and empathetic wellness assistant inside the Blósom app — a PCOD/PCOS health tracking platform. You are talking to ${name}.

${hasPCOD ? `${name} has been diagnosed with PCOD/PCOS.` : ''}
${user?.healthProfile?.medications?.length ? `Current medications: ${user.healthProfile.medications.join(', ')}` : ''}

HERE IS ${name.toUpperCase()}'S PERSONAL HEALTH DATA:
${dataContext}

YOUR ROLE:
- Analyze their personal data and give specific, personalized insights
- Reference their actual symptoms, cycle patterns and trends
- Give practical, actionable advice for managing PCOD
- Be warm, supportive and non-judgmental
- Always recommend consulting a doctor for medical decisions
- Keep responses concise but thorough (3-5 paragraphs max)
- Use emojis occasionally to keep the tone warm
- If they ask about their next period, reference their actual prediction data
- If they ask about their symptoms, reference their actual logged symptoms

IMPORTANT: You are NOT a doctor. Always remind users to consult healthcare professionals for medical advice. Focus on lifestyle, wellness, and understanding their patterns.`;
  };

  // ── Send message ──
  const sendMessage = async (messageText) => {
    const text = messageText || input.trim();
    if (!text || loading) return;

    const userMessage = {
      id:      Date.now(),
      role:    'user',
      content: text,
      time:    new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    try {
      // Build conversation history for Claude
      const conversationHistory = [
        ...messages.map((m) => ({
          role:    m.role,
          content: m.content,
        })),
        { role: 'user', content: text },
      ];

     // Call our backend which calls Claude API
      const token = localStorage.getItem('token');
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          systemPrompt:  buildSystemPrompt(),
          messages:      conversationHistory,
        }),
      });

      const data = await response.json();

      const aiText = data.message ||
        'Sorry, I could not generate a response. Please try again.';

      const aiMessage = {
        id:      Date.now() + 1,
        role:    'assistant',
        content: aiText,
        time:    new Date(),
      };

      setMessages((prev) => [...prev, aiMessage]);

    } catch (err) {
      console.error('Chat error:', err);
      setMessages((prev) => [
        ...prev,
        {
          id:      Date.now() + 1,
          role:    'assistant',
          content: 'Sorry, I had trouble connecting. Please check your connection and try again. 🌸',
          time:    new Date(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // ── Handle keyboard ──
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // ── Auto resize textarea ──
  const handleTextareaChange = (e) => {
    setInput(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
  };

  // ── Get initials ──
  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  return (
    
    <div className="chat-page">

{/* ── Disclaimer ── */}
      <div className="chat-disclaimer">
        ⚠️ Blossom AI provides wellness guidance only.
        Always consult a healthcare professional for medical advice.
      </div>
      {/* ── Chat Header ── */}
      <div className="chat-header-card">
        <div className="chat-ai-avatar">🌸</div>
        <div className="chat-header-info">
          <div className="chat-header-name">Blósom AI</div>
          <div className="chat-header-status">
            <div className="chat-status-dot" />
            Online · Analyzing your health data
          </div>
        </div>
        <div className="chat-header-badge">
          ✦ Powered by Groq AI
        </div>
      </div>


      {/* ── Messages ── */}
      <div className="chat-messages">

        {/* Welcome screen */}
        {messages.length === 0 && (
          <div className="chat-welcome">
            <div className="chat-welcome-icon">🌸</div>
            <div className="chat-welcome-title">
              Hi {user?.name?.split(' ')[0]}! I'm Blossom AI
            </div>
            <p className="chat-welcome-sub">
              I've analyzed your cycle and symptom data.
              Ask me anything about your PCOD health —
              I'll give you personalized insights based
              on your actual data.
            </p>

            <div className="chat-suggestions">
              {SUGGESTIONS.map((s, i) => (
                <button
                  key={i}
                  className="chat-suggestion-chip"
                  onClick={() => sendMessage(s)}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Messages */}
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`chat-message ${msg.role === 'user' ? 'user' : ''}`}
          >
            {/* Avatar */}
            <div className={`message-avatar ${msg.role === 'user' ? 'user-av' : 'ai'}`}>
              {msg.role === 'user' ? initials : '🌸'}
            </div>

            {/* Bubble */}
            <div>
              <div className={`message-bubble ${msg.role === 'user' ? 'user' : 'ai'}`}>
                {msg.content.split('\n').map((line, i) => (
                  <span key={i}>
                    {line}
                    {i < msg.content.split('\n').length - 1 && <br />}
                  </span>
                ))}
              </div>
              <div className="message-time">
                {formatTime(msg.time)}
              </div>
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {loading && (
          <div className="typing-indicator">
            <div className="message-avatar ai">🌸</div>
            <div className="typing-dots">
              <div className="typing-dot" />
              <div className="typing-dot" />
              <div className="typing-dot" />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* ── Input Area ── */}
      <div className="chat-input-area">
        <div className="chat-input-box">
          <textarea
            ref={textareaRef}
            className="chat-textarea"
            placeholder="Ask me about your PCOD health..."
            value={input}
            onChange={handleTextareaChange}
            onKeyDown={handleKeyDown}
            rows={1}
          />
          <button
            className="chat-send-btn"
            onClick={() => sendMessage()}
            disabled={!input.trim() || loading}
          >
            ➤
          </button>
        </div>
        
        <p className="chat-input-hint">
          Press Enter to send · Shift+Enter for new line
        </p>
        
      </div>

    </div>
  );
};

export default Chatbot;