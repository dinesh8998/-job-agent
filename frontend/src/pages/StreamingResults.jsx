import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Input, Button, Typography, Avatar, Spin } from 'antd';
import { Send, User, Cpu, Sparkles, Square, CheckCircle, Loader, Search, BarChart3, FileText } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import PageHeader from '../components/PageHeader';

const { Title } = Typography;

// Progress step labels
const PROGRESS_STEPS = [
  { key: 'analyzing', label: 'Analyzing resume...', icon: FileText },
  { key: 'finding', label: 'Finding jobs...', icon: Search },
  { key: 'matching', label: 'Matching skills...', icon: BarChart3 },
  { key: 'generating', label: 'Generating recommendations...', icon: Sparkles },
];

function deriveStepStates(rawText) {
  const lower = rawText.toLowerCase();
  const states = {};
  let lastDoneIdx = -1;

  const markers = [
    { key: 'analyzing', text: 'analyzing resume' },
    { key: 'finding', text: 'finding jobs' },
    { key: 'matching', text: 'matching skills' },
    { key: 'generating', text: 'generating recommendations' },
  ];

  markers.forEach((m, i) => {
    if (lower.includes(m.text)) {
      states[m.key] = 'done';
      lastDoneIdx = i;
    }
  });

  if (lastDoneIdx < markers.length - 1) {
    const nextKey = markers[lastDoneIdx + 1]?.key;
    if (nextKey && !states[nextKey]) {
      states[nextKey] = 'active';
    }
  }

  return states;
}

function stripProgressLines(raw) {
  const lines = raw.split('\n');
  const cleaned = lines.filter(
    (line) => !line.match(/^(Analyzing resume|Finding jobs|Matching skills|Generating recommendations)\.\.\.?\s*$/i)
  );
  return cleaned.join('\n').replace(/^\n+/, '');
}

// Progress bar component
const StreamProgress = ({ rawText, visible }) => {
  if (!visible) return null;
  const states = deriveStepStates(rawText);

  return (
    <div className="fade-in" style={{
      display: 'flex',
      flexWrap: 'wrap',
      gap: 8,
      marginBottom: 16,
      padding: '12px 16px',
      background: 'rgba(0,0,0,0.15)',
      borderRadius: 12,
      border: '1px solid rgba(255,255,255,0.04)',
    }}>
      {PROGRESS_STEPS.map((step, i) => {
        const state = states[step.key];
        const Icon = step.icon;
        const isDone = state === 'done';
        const isActive = state === 'active';

        return (
          <div
            key={step.key}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '5px 12px',
              borderRadius: 99,
              fontSize: 12,
              fontWeight: 500,
              opacity: isDone || isActive ? 1 : 0.35,
              transition: 'all 300ms ease',
              background: isDone
                ? 'rgba(52,211,153,0.1)'
                : isActive
                ? 'rgba(99,102,241,0.1)'
                : 'transparent',
              color: isDone
                ? '#34d399'
                : isActive
                ? '#6366f1'
                : '#5a6478',
              border: `1px solid ${isDone ? 'rgba(52,211,153,0.2)' : isActive ? 'rgba(99,102,241,0.2)' : 'transparent'}`,
            }}
          >
            {isDone ? (
              <CheckCircle size={13} />
            ) : isActive ? (
              <Loader size={13} className="pulse" />
            ) : (
              <Icon size={13} />
            )}
            <span>{step.label.replace('...', '')}</span>
          </div>
        );
      })}
    </div>
  );
};

// Main component
const StreamingResults = () => {
  const location = useLocation();
  const initialQuery = location.state?.query || '';
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState(initialQuery);
  const [isStreaming, setIsStreaming] = useState(false);
  const messagesEndRef = useRef(null);
  const abortRef = useRef(null);

  useEffect(() => {
    if (initialQuery && messages.length === 0) {
      handleSend(initialQuery);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialQuery]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const handleAbort = () => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
  };

  const handleSend = async (queryText) => {
    const text = typeof queryText === 'string' ? queryText : inputValue;
    if (!text.trim()) return;

    const userMsg = { id: Date.now(), sender: 'user', content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInputValue('');
    setIsStreaming(true);

    const aiMsgId = Date.now() + 1;
    setMessages((prev) => [
      ...prev,
      { id: aiMsgId, sender: 'ai', content: '', rawContent: '', isThinking: true },
    ]);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const response = await fetch('http://localhost:8000/stream-jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: text }),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let done = false;
      let rawContent = '';

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        if (value) {
          const chunk = decoder.decode(value, { stream: !done });
          rawContent += chunk;
          const displayContent = stripProgressLines(rawContent);

          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === aiMsgId
                ? {
                    ...msg,
                    isThinking: false,
                    rawContent,
                    content: displayContent,
                    isStreaming: !done,
                  }
                : msg
            )
          );
        }
      }

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === aiMsgId ? { ...msg, isStreaming: false } : msg
        )
      );
    } catch (error) {
      if (error.name === 'AbortError') {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === aiMsgId
              ? { ...msg, isThinking: false, isStreaming: false, content: msg.content + '\n\n*— Stream cancelled —*' }
              : msg
          )
        );
      } else {
        console.error('Streaming error:', error);
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === aiMsgId
              ? {
                  ...msg,
                  isThinking: false,
                  isStreaming: false,
                  content:
                    'Error: Unable to connect to the backend server. Make sure the backend is running at `http://localhost:8000`.',
                }
              : msg
          )
        );
      }
    } finally {
      abortRef.current = null;
      setIsStreaming(false);
    }
  };

  return (
    <div style={{ maxWidth: 840, margin: '0 auto', height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column' }}>
      <PageHeader
        icon={Sparkles}
        title="Live AI Stream"
        subtitle="Real-time AI-powered job analysis and recommendations."
      />

      {/* Chat Container */}
      <div className="fade-in" style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        background: 'rgba(17, 24, 39, 0.4)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 20,
        overflow: 'hidden',
      }}>
        {/* Messages Area */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: 24,
          display: 'flex',
          flexDirection: 'column',
          gap: 24,
        }}>
          {messages.length === 0 ? (
            <div style={{
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <div style={{ textAlign: 'center' }}>
                <div className="float" style={{
                  width: 72,
                  height: 72,
                  borderRadius: 20,
                  background: 'rgba(99, 102, 241, 0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 20px',
                }}>
                  <Cpu size={32} style={{ color: '#6366f1', opacity: 0.4 }} />
                </div>
                <p style={{ color: '#5a6478', fontSize: 14 }}>
                  Send a query to start streaming AI job recommendations.
                </p>
              </div>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className="fade-in"
                style={{
                  display: 'flex',
                  gap: 14,
                  flexDirection: msg.sender === 'user' ? 'row-reverse' : 'row',
                }}
              >
                <Avatar
                  style={{
                    background: msg.sender === 'user'
                      ? 'linear-gradient(135deg, #6366f1, #a855f7)'
                      : 'linear-gradient(135deg, #22d3ee, #34d399)',
                    flexShrink: 0,
                    boxShadow: msg.sender === 'user'
                      ? '0 0 12px rgba(99,102,241,0.3)'
                      : '0 0 12px rgba(34,211,238,0.2)',
                  }}
                  icon={msg.sender === 'user' ? <User size={15} /> : <Cpu size={15} />}
                />
                <div
                  style={{
                    padding: '14px 18px',
                    borderRadius: 18,
                    borderTopRightRadius: msg.sender === 'user' ? 4 : 18,
                    borderTopLeftRadius: msg.sender === 'ai' ? 4 : 18,
                    maxWidth: '85%',
                    minWidth: 120,
                    background: msg.sender === 'user'
                      ? 'rgba(99, 102, 241, 0.1)'
                      : 'rgba(17, 24, 39, 0.7)',
                    border: `1px solid ${msg.sender === 'user' ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.06)'}`,
                  }}
                >
                  {msg.isThinking ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div className="pulse" style={{
                        display: 'flex',
                        gap: 4,
                      }}>
                        {[0, 1, 2].map(i => (
                          <div key={i} style={{
                            width: 6,
                            height: 6,
                            borderRadius: '50%',
                            background: '#6366f1',
                            animation: `pulse 1.4s ease-in-out ${i * 0.16}s infinite`,
                          }} />
                        ))}
                      </div>
                      <span style={{ color: '#5a6478', fontSize: 13 }}>Connecting to AI...</span>
                    </div>
                  ) : msg.sender === 'ai' ? (
                    <>
                      <StreamProgress
                        rawText={msg.rawContent || ''}
                        visible={!!msg.rawContent && msg.rawContent.includes('...')}
                      />
                      {msg.content ? (
                        <div className={`ai-markdown ${msg.isStreaming ? 'typing-cursor' : ''}`}>
                          <ReactMarkdown>{msg.content}</ReactMarkdown>
                        </div>
                      ) : msg.isStreaming ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <Spin size="small" />
                          <span style={{ color: '#5a6478', fontSize: 13 }}>Processing...</span>
                        </div>
                      ) : null}
                    </>
                  ) : (
                    <p style={{ margin: 0, color: '#f0f2f8', lineHeight: 1.6 }}>
                      {msg.content}
                    </p>
                  )}
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div style={{
          padding: '16px 20px',
          borderTop: '1px solid rgba(255,255,255,0.04)',
          background: 'rgba(10, 14, 26, 0.6)',
          backdropFilter: 'blur(20px)',
        }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <Input
              id="stream-query-input"
              size="large"
              placeholder="e.g. SOC Analyst, Threat Hunter, Penetration Tester..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onPressEnter={() => handleSend()}
              disabled={isStreaming}
              style={{
                borderRadius: 14,
                height: 48,
                background: 'rgba(17, 24, 39, 0.6)',
                border: '1px solid rgba(255,255,255,0.06)',
                fontSize: 14,
              }}
            />
            {isStreaming ? (
              <Button
                id="stream-stop-btn"
                type="default"
                shape="circle"
                size="large"
                danger
                icon={<Square size={14} />}
                onClick={handleAbort}
                style={{
                  width: 48,
                  height: 48,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 14,
                }}
              />
            ) : (
              <Button
                id="stream-send-btn"
                type="primary"
                size="large"
                icon={<Send size={16} />}
                onClick={() => handleSend()}
                disabled={!inputValue.trim()}
                style={{
                  width: 48,
                  height: 48,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 14,
                }}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StreamingResults;
