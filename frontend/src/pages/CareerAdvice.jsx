import React, { useState, useEffect, useRef } from 'react';
import { Typography, Input, Button, Spin, Switch } from 'antd';
import { Compass, ArrowRight, ShieldCheck, BookOpen, Route, AlertTriangle, Sparkles, Target, TrendingUp, Clock, Lightbulb, Zap, Award } from 'lucide-react';
import axios from 'axios';
import GlassCard from '../components/GlassCard';
import SkillBadge from '../components/SkillBadge';
import EmptyState from '../components/EmptyState';

const { Paragraph, Text } = Typography;

const PRIORITY_STYLES = {
  critical: {
    bg: 'rgba(251,113,133,0.08)',
    border: 'rgba(251,113,133,0.25)',
    color: '#fb7185',
    label: '🔴 Critical',
    dot: '#fb7185',
  },
  important: {
    bg: 'rgba(251,191,36,0.08)',
    border: 'rgba(251,191,36,0.25)',
    color: '#fbbf24',
    label: '🟡 Important',
    dot: '#fbbf24',
  },
  'nice-to-have': {
    bg: 'rgba(96,165,250,0.08)',
    border: 'rgba(96,165,250,0.25)',
    color: '#60a5fa',
    label: '🟢 Nice-to-Have',
    dot: '#60a5fa',
  },
};

const CareerAdvice = () => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [advice, setAdvice] = useState(null);
  const [error, setError] = useState(null);
  const [streamMode, setStreamMode] = useState(false);
  const [streamText, setStreamText] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [quickTips, setQuickTips] = useState(null);
  const streamRef = useRef(null);

  // Load quick tips on mount
  useEffect(() => {
    axios.get('http://localhost:8000/career-advice/quick-tips')
      .then(res => setQuickTips(res.data))
      .catch(() => {
        setQuickTips({
          has_resume: false,
          tips: [
            'Upload your resume to get personalized career tips.',
            'Ask specific questions like "How can I become a Threat Hunter?"',
          ],
        });
      });
  }, []);

  const handleAsk = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    setAdvice(null);
    setStreamText('');

    if (streamMode) {
      // Streaming mode
      setIsStreaming(true);
      try {
        const response = await fetch('http://localhost:8000/career-advice/stream', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query }),
        });
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let accumulated = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          accumulated += chunk;
          setStreamText(accumulated);
        }
      } catch (err) {
        console.warn('Stream failed, falling back.', err);
        setStreamText('## ⚠️ Stream unavailable\n\nCould not connect to the Career Advisor stream. Please try structured mode or check the backend connection.');
      } finally {
        setIsStreaming(false);
        setLoading(false);
      }
    } else {
      // Structured JSON mode
      try {
        const response = await axios.post('http://localhost:8000/career-advice', { query });
        setAdvice(response.data);
      } catch (err) {
        console.warn('Backend unavailable, using mock data.', err);
        const target = query.toLowerCase().includes('hunter')
          ? 'Threat Hunter'
          : query.toLowerCase().includes('engineer')
          ? 'Security Engineer'
          : query.toLowerCase().includes('architect')
          ? 'Security Architect'
          : 'Senior SOC Analyst';

        setAdvice({
          current_role: 'SOC Analyst',
          next_role: target,
          missing_skills: [
            { name: 'Python Automation', priority: 'critical', reason: 'Essential for automating security workflows and threat hunting scripts.' },
            { name: 'Splunk Enterprise Security', priority: 'critical', reason: 'Industry-standard SIEM platform used by most enterprise SOCs.' },
            { name: 'Azure Sentinel', priority: 'important', reason: 'Cloud-native SIEM growing rapidly in enterprise adoption.' },
            { name: 'Threat Intelligence Hunting', priority: 'important', reason: 'Core competency for proactive threat detection.' },
            { name: 'Malware Analysis', priority: 'nice-to-have', reason: 'Deepens understanding of adversary tactics and IOC creation.' },
          ],
          recommended_certifications: [
            { name: 'SC-200', provider: 'Microsoft', reason: 'Validates Azure Sentinel and Defender skills for cloud security operations.' },
            { name: 'PNPT', provider: 'TCM Security', reason: 'Hands-on penetration testing cert that builds offensive mindset.' },
            { name: 'OSCP', provider: 'OffSec', reason: 'Gold-standard offensive security certification recognized globally.' },
          ],
          recommended_career_path: `Currently you work as a SOC Analyst. To become a ${target}, focus on building Python scripting automation skills, deepen your SIEM engineering capabilities, and practice threat hunting on labs. Acquire certifications like SC-200 and PNPT. Build a portfolio of detection rules and threat hunting queries.`,
          market_demand: `The ${target} role is in high demand with a projected 30% growth over the next 3 years as organizations invest in proactive security.`,
          timeline_estimate: '6-12 months',
        });
      } finally {
        setLoading(false);
      }
    }
  };

  // Helper: Parse missing_skills (handle both old string[] and new object[] format)
  const getSkills = () => {
    if (!advice?.missing_skills) return [];
    return advice.missing_skills.map(s =>
      typeof s === 'string' ? { name: s, priority: 'important', reason: '' } : s
    );
  };

  // Helper: Parse certifications (handle both old string[] and new object[] format)
  const getCerts = () => {
    if (!advice?.recommended_certifications) return [];
    return advice.recommended_certifications.map(c =>
      typeof c === 'string' ? { name: c, provider: '', reason: '' } : c
    );
  };

  // Simple Markdown renderer for stream mode
  const renderMarkdown = (text) => {
    if (!text) return null;
    const lines = text.split('\n');
    return lines.map((line, i) => {
      if (line.startsWith('## ')) {
        return <h3 key={i} style={{ fontFamily: "'Outfit', sans-serif", fontSize: 20, fontWeight: 700, color: '#f0f2f8', margin: '24px 0 12px', background: 'linear-gradient(135deg, #a855f7, #6366f1)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{line.replace('## ', '')}</h3>;
      }
      if (line.startsWith('### ')) {
        return <h4 key={i} style={{ fontFamily: "'Outfit', sans-serif", fontSize: 16, fontWeight: 600, color: '#f0f2f8', margin: '16px 0 8px' }}>{line.replace('### ', '')}</h4>;
      }
      if (line.startsWith('- **')) {
        const content = line.replace('- **', '').replace('**', '');
        return <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 6, paddingLeft: 8 }}><span style={{ color: '#6366f1', fontWeight: 700 }}>•</span><span style={{ color: '#8591a8', fontSize: 14, lineHeight: 1.7 }} dangerouslySetInnerHTML={{ __html: content.replace(/\*\*(.*?)\*\*/g, '<strong style="color:#f0f2f8">$1</strong>') }} /></div>;
      }
      if (line.startsWith('- ')) {
        return <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 4, paddingLeft: 8 }}><span style={{ color: '#6366f1' }}>•</span><span style={{ color: '#8591a8', fontSize: 14, lineHeight: 1.7 }} dangerouslySetInnerHTML={{ __html: line.slice(2).replace(/\*\*(.*?)\*\*/g, '<strong style="color:#f0f2f8">$1</strong>') }} /></div>;
      }
      if (line.trim() === '') return <div key={i} style={{ height: 8 }} />;
      return <p key={i} style={{ color: '#8591a8', fontSize: 14, lineHeight: 1.7, margin: '0 0 4px' }} dangerouslySetInnerHTML={{ __html: line.replace(/\*\*(.*?)\*\*/g, '<strong style="color:#f0f2f8">$1</strong>') }} />;
    });
  };

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      {/* Header */}
      <div className="fade-in" style={{ textAlign: 'center', marginBottom: 40 }}>
        <div style={{
          width: 68,
          height: 68,
          borderRadius: 20,
          background: 'linear-gradient(135deg, rgba(168,85,247,0.15), rgba(99,102,241,0.15))',
          border: '1px solid rgba(168,85,247,0.25)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 20px',
        }}>
          <Compass size={32} color="#a855f7" />
        </div>

        <h2 style={{
          fontFamily: "'Outfit', sans-serif",
          fontSize: 32,
          fontWeight: 700,
          margin: '0 0 12px',
          background: 'linear-gradient(135deg, #a855f7, #6366f1, #22d3ee)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}>
          Career Advisor
        </h2>
        <Paragraph style={{ fontSize: 15, color: '#8591a8', maxWidth: 520, margin: '0 auto', lineHeight: 1.7 }}>
          Ask any career question. Our AI analyzes your profile, compares it against the market, and gives you a personalized roadmap.
        </Paragraph>

        {/* Mode Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 20 }}>
          <span style={{ fontSize: 13, color: !streamMode ? '#6366f1' : '#5a6478', fontWeight: 600, transition: 'color 200ms' }}>Structured</span>
          <Switch
            id="career-mode-toggle"
            checked={streamMode}
            onChange={setStreamMode}
            style={{ background: streamMode ? '#a855f7' : 'rgba(255,255,255,0.12)' }}
          />
          <span style={{ fontSize: 13, color: streamMode ? '#a855f7' : '#5a6478', fontWeight: 600, transition: 'color 200ms' }}>Stream</span>
        </div>

        {/* Query Input */}
        <div style={{ display: 'flex', gap: 12, marginTop: 24, maxWidth: 640, margin: '24px auto 0' }}>
          <Input
            id="career-advice-input"
            size="large"
            placeholder="e.g. How can I become a Threat Hunter?"
            prefix={<Sparkles size={18} color="#5a6478" style={{ marginRight: 8 }} />}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onPressEnter={handleAsk}
            style={{
              borderRadius: 12,
              height: 50,
              fontSize: 15,
              background: 'rgba(17, 24, 39, 0.6)',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
          />
          <Button
            id="career-advice-submit"
            type="primary"
            size="large"
            onClick={handleAsk}
            loading={loading}
            style={{
              height: 50,
              padding: '0 28px',
              borderRadius: 12,
              fontSize: 15,
              fontWeight: 600,
              background: 'linear-gradient(135deg, #a855f7, #6366f1)',
              border: 'none',
            }}
          >
            {streamMode ? 'Stream' : 'Get Advice'}
          </Button>
        </div>
      </div>

      {/* Quick Tips Banner */}
      {quickTips && !advice && !streamText && !loading && (
        <GlassCard hoverable={false} style={{ marginBottom: 28, borderColor: 'rgba(99,102,241,0.15)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'rgba(251,191,36,0.1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Lightbulb size={18} color="#fbbf24" />
            </div>
            <h4 style={{ fontFamily: "'Outfit', sans-serif", fontSize: 15, fontWeight: 600, color: '#f0f2f8', margin: 0 }}>
              Quick Tips
            </h4>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {quickTips.tips.map((tip, i) => (
              <div key={i} className="fade-in" style={{ display: 'flex', gap: 10, alignItems: 'flex-start', animationDelay: `${i * 80}ms` }}>
                <Zap size={14} color="#fbbf24" style={{ marginTop: 3, flexShrink: 0 }} />
                <span style={{ color: '#8591a8', fontSize: 13, lineHeight: 1.6 }}>{tip}</span>
              </div>
            ))}
          </div>
        </GlassCard>
      )}

      {/* Loading State */}
      {loading && (
        <div className="fade-in" style={{ textAlign: 'center', padding: '60px 0' }}>
          <div className="pulse-glow" style={{
            width: 64, height: 64, borderRadius: '50%',
            background: 'rgba(168, 85, 247, 0.08)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 20px',
          }}>
            <Compass size={28} color="#a855f7" className="spin" />
          </div>
          <p style={{ color: '#8591a8', fontSize: 15 }}>
            {streamMode ? 'Streaming career advice...' : 'Analyzing your profile against market demand...'}
          </p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <GlassCard hoverable={false} style={{ marginBottom: 24, borderColor: 'rgba(251,113,133,0.3)' }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <AlertTriangle size={20} color="#fb7185" />
            <Text style={{ color: '#fb7185' }}>{error}</Text>
          </div>
        </GlassCard>
      )}

      {/* ===== STREAM MODE RESULTS ===== */}
      {streamMode && streamText && !loading && (
        <div className="fade-in">
          <GlassCard hoverable={false} style={{
            borderColor: 'rgba(168,85,247,0.2)',
            background: 'linear-gradient(135deg, rgba(168,85,247,0.03), rgba(99,102,241,0.03))',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: 'rgba(168,85,247,0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Sparkles size={18} color="#a855f7" />
              </div>
              <h4 style={{ fontFamily: "'Outfit', sans-serif", fontSize: 16, fontWeight: 600, color: '#f0f2f8', margin: 0 }}>
                AI Career Analysis
              </h4>
              {isStreaming && <div className="pulse-glow" style={{ width: 8, height: 8, borderRadius: '50%', background: '#a855f7', marginLeft: 'auto' }} />}
            </div>
            <div>{renderMarkdown(streamText)}</div>
          </GlassCard>
        </div>
      )}

      {/* ===== STRUCTURED MODE RESULTS ===== */}
      {!streamMode && advice && !loading && (
        <div className="fade-in">
          {/* Role Progression */}
          <GlassCard hoverable={false} style={{
            marginBottom: 24,
            background: 'linear-gradient(135deg, rgba(168,85,247,0.06), rgba(99,102,241,0.06))',
            borderColor: 'rgba(168,85,247,0.2)',
          }}>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              gap: 32, padding: '16px 0', flexWrap: 'wrap',
            }}>
              {/* Current Role */}
              <div style={{ textAlign: 'center' }}>
                <span style={{ fontSize: 11, color: '#5a6478', textTransform: 'uppercase', letterSpacing: 1.5, fontWeight: 600 }}>
                  Current Role
                </span>
                <h3 style={{ fontFamily: "'Outfit', sans-serif", fontSize: 24, fontWeight: 700, color: '#f0f2f8', margin: '6px 0 0' }}>
                  {advice.current_role}
                </h3>
              </div>

              {/* Animated Arrow */}
              <div style={{
                width: 56, height: 56, borderRadius: '50%',
                background: 'linear-gradient(135deg, #a855f7, #6366f1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                boxShadow: '0 0 30px rgba(168,85,247,0.3)',
                animation: 'pulseGlow 3s ease-in-out infinite',
              }}>
                <ArrowRight size={26} color="#fff" />
              </div>

              {/* Target Role */}
              <div style={{ textAlign: 'center' }}>
                <span style={{ fontSize: 11, color: '#5a6478', textTransform: 'uppercase', letterSpacing: 1.5, fontWeight: 600 }}>
                  Target Role
                </span>
                <h3 style={{
                  fontFamily: "'Outfit', sans-serif", fontSize: 24, fontWeight: 700, margin: '6px 0 0',
                  background: 'linear-gradient(135deg, #a855f7, #22d3ee)',
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                }}>
                  {advice.next_role}
                </h3>
              </div>
            </div>
          </GlassCard>

          {/* Market Demand & Timeline Row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
            {/* Market Demand */}
            {advice.market_demand && (
              <GlassCard hoverable={false}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 12,
                    background: 'rgba(52,211,153,0.1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <TrendingUp size={18} color="#34d399" />
                  </div>
                  <h4 style={{ fontFamily: "'Outfit', sans-serif", fontSize: 16, fontWeight: 600, color: '#f0f2f8', margin: 0 }}>
                    Market Demand
                  </h4>
                </div>
                <p style={{ color: '#8591a8', fontSize: 14, lineHeight: 1.7, margin: 0 }}>
                  {advice.market_demand}
                </p>
              </GlassCard>
            )}

            {/* Timeline Estimate */}
            {advice.timeline_estimate && (
              <GlassCard hoverable={false}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 12,
                    background: 'rgba(99,102,241,0.1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Clock size={18} color="#6366f1" />
                  </div>
                  <h4 style={{ fontFamily: "'Outfit', sans-serif", fontSize: 16, fontWeight: 600, color: '#f0f2f8', margin: 0 }}>
                    Timeline
                  </h4>
                </div>
                <div style={{
                  fontSize: 28, fontWeight: 800, fontFamily: "'Outfit', sans-serif",
                  background: 'linear-gradient(135deg, #6366f1, #22d3ee)',
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                  marginBottom: 8,
                }}>
                  {advice.timeline_estimate}
                </div>
                <div style={{
                  height: 6, borderRadius: 3,
                  background: 'rgba(255,255,255,0.06)',
                  overflow: 'hidden',
                }}>
                  <div className="fade-in" style={{
                    height: '100%', borderRadius: 3,
                    background: 'linear-gradient(90deg, #6366f1, #a855f7, #22d3ee)',
                    width: '65%',
                    animation: 'slideInFromLeft 1.5s ease-out forwards',
                  }} />
                </div>
                <p style={{ color: '#5a6478', fontSize: 12, marginTop: 6, margin: '6px 0 0' }}>Estimated transition time</p>
              </GlassCard>
            )}
          </div>

          {/* Skills Gap with Priority */}
          <GlassCard hoverable={false} style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <div style={{
                width: 40, height: 40, borderRadius: 12,
                background: 'rgba(251,191,36,0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Target size={18} color="#fbbf24" />
              </div>
              <div>
                <h4 style={{ fontFamily: "'Outfit', sans-serif", fontSize: 16, fontWeight: 600, color: '#f0f2f8', margin: 0 }}>
                  Skills Gap Analysis
                </h4>
                <p style={{ fontSize: 12, color: '#5a6478', margin: 0 }}>
                  {getSkills().length} skills to develop
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {getSkills().map((skill, i) => {
                const ps = PRIORITY_STYLES[skill.priority] || PRIORITY_STYLES['important'];
                return (
                  <div key={skill.name} className="fade-in" style={{
                    display: 'flex', alignItems: 'flex-start', gap: 14,
                    padding: '12px 16px', borderRadius: 12,
                    background: ps.bg, border: `1px solid ${ps.border}`,
                    animationDelay: `${i * 80}ms`,
                    transition: 'transform 200ms ease, box-shadow 200ms ease',
                  }}>
                    <div style={{
                      width: 10, height: 10, borderRadius: '50%',
                      background: ps.dot, marginTop: 5, flexShrink: 0,
                      boxShadow: `0 0 8px ${ps.dot}40`,
                    }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                        <span style={{ fontSize: 14, fontWeight: 600, color: '#f0f2f8' }}>{skill.name}</span>
                        <span style={{
                          fontSize: 10, fontWeight: 700, color: ps.color,
                          padding: '2px 8px', borderRadius: 99,
                          background: `${ps.bg}`,
                          border: `1px solid ${ps.border}`,
                          textTransform: 'uppercase', letterSpacing: 0.5,
                        }}>
                          {skill.priority}
                        </span>
                      </div>
                      {skill.reason && (
                        <p style={{ color: '#8591a8', fontSize: 12, lineHeight: 1.5, margin: 0 }}>{skill.reason}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </GlassCard>

          {/* Certifications with Reasons */}
          <GlassCard hoverable={false} style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <div style={{
                width: 40, height: 40, borderRadius: 12,
                background: 'rgba(52,211,153,0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Award size={18} color="#34d399" />
              </div>
              <div>
                <h4 style={{ fontFamily: "'Outfit', sans-serif", fontSize: 16, fontWeight: 600, color: '#f0f2f8', margin: 0 }}>
                  Recommended Certifications
                </h4>
                <p style={{ fontSize: 12, color: '#5a6478', margin: 0 }}>
                  {getCerts().length} credentials to pursue
                </p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 12 }}>
              {getCerts().map((cert, i) => (
                <div key={cert.name} className="fade-in" style={{
                  padding: '16px',
                  borderRadius: 12,
                  background: 'rgba(52,211,153,0.04)',
                  border: '1px solid rgba(52,211,153,0.15)',
                  animationDelay: `${i * 100}ms`,
                  transition: 'transform 200ms ease, border-color 200ms ease',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <ShieldCheck size={16} color="#34d399" />
                    <span style={{ fontSize: 15, fontWeight: 700, color: '#34d399' }}>{cert.name}</span>
                  </div>
                  {cert.provider && (
                    <p style={{ fontSize: 11, color: '#5a6478', margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 600 }}>
                      {cert.provider}
                    </p>
                  )}
                  {cert.reason && (
                    <p style={{ color: '#8591a8', fontSize: 12, lineHeight: 1.5, margin: 0 }}>{cert.reason}</p>
                  )}
                </div>
              ))}
            </div>
          </GlassCard>

          {/* Career Roadmap */}
          {advice.recommended_career_path && (
            <GlassCard hoverable={false}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 12,
                  background: 'rgba(99,102,241,0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Route size={18} color="#6366f1" />
                </div>
                <h4 style={{ fontFamily: "'Outfit', sans-serif", fontSize: 16, fontWeight: 600, color: '#f0f2f8', margin: 0 }}>
                  Career Roadmap
                </h4>
              </div>

              {/* Timeline style */}
              <div style={{
                position: 'relative', paddingLeft: 24,
                borderLeft: '2px solid rgba(99,102,241,0.2)',
              }}>
                {advice.recommended_career_path.split('. ').filter(Boolean).map((sentence, i) => (
                  <div key={i} className="fade-in" style={{
                    position: 'relative', paddingBottom: 20, paddingLeft: 16,
                    animationDelay: `${i * 120}ms`,
                  }}>
                    {/* Timeline dot */}
                    <div style={{
                      position: 'absolute', left: -31, top: 4,
                      width: 12, height: 12, borderRadius: '50%',
                      background: i === 0 ? '#6366f1' : 'rgba(99,102,241,0.3)',
                      border: '2px solid rgba(10, 14, 26, 1)',
                      boxShadow: i === 0 ? '0 0 8px rgba(99,102,241,0.4)' : 'none',
                    }} />
                    <p style={{ color: '#8591a8', fontSize: 14, lineHeight: 1.7, margin: 0 }}>
                      {sentence.trim()}{!sentence.endsWith('.') ? '.' : ''}
                    </p>
                  </div>
                ))}
              </div>
            </GlassCard>
          )}
        </div>
      )}

      {/* Empty state */}
      {!advice && !streamText && !loading && !error && !quickTips && (
        <EmptyState
          icon={BookOpen}
          title="Ask for Career Advice"
          description="Enter a career question above to get your personalized roadmap and skill gap analysis."
          iconColor="#a855f7"
        />
      )}
    </div>
  );
};

export default CareerAdvice;
