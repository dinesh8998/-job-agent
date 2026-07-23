import React from 'react';
import { Button, Typography } from 'antd';
import { 
  FileText, Cpu, Search, ArrowRight, Upload, Compass, 
  TrendingUp, Briefcase, Target, Sparkles, Zap, Clock
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import StatCard from '../components/StatCard';
import GlassCard from '../components/GlassCard';
import PageHeader from '../components/PageHeader';

const { Title, Paragraph } = Typography;

const Dashboard = () => {
  const navigate = useNavigate();

  const stats = [
    { icon: Briefcase, label: 'Jobs Analyzed', value: 1247, trend: 12, trendLabel: 'this week', accentColor: '#6366f1' },
    { icon: Target, label: 'Resume Score', value: 92, suffix: '%', trend: 5, trendLabel: 'improved', accentColor: '#34d399' },
    { icon: Sparkles, label: 'Skills Matched', value: 28, trend: 8, trendLabel: 'new', accentColor: '#a855f7' },
    { icon: TrendingUp, label: 'Applications', value: 15, trend: -3, trendLabel: 'vs last week', accentColor: '#22d3ee' },
  ];

  const quickActions = [
    {
      title: 'Upload Resume',
      description: 'Parse your resume with AI to extract skills and experience.',
      icon: Upload,
      color: '#6366f1',
      path: '/upload',
    },
    {
      title: 'Search Jobs',
      description: 'Find perfectly matched jobs using AI-powered search.',
      icon: Search,
      color: '#22d3ee',
      path: '/search',
    },
    {
      title: 'Career Advice',
      description: 'Get personalized career roadmap and skill gap analysis.',
      icon: Compass,
      color: '#a855f7',
      path: '/career-advice',
    },
  ];

  const recentActivity = [
    { text: 'Resume analyzed — 7 skills extracted', time: '2 hours ago', icon: FileText, color: '#6366f1' },
    { text: 'Searched for "Security Analyst Remote"', time: '5 hours ago', icon: Search, color: '#22d3ee' },
    { text: 'Career advice requested for Threat Hunter', time: '1 day ago', icon: Compass, color: '#a855f7' },
    { text: '3 new job matches found', time: '2 days ago', icon: Briefcase, color: '#34d399' },
  ];

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      {/* Hero Section */}
      <div className="dashboard-hero fade-in" style={{
        position: 'relative',
        padding: '48px 40px',
        borderRadius: 20,
        background: 'linear-gradient(135deg, rgba(99,102,241,0.08) 0%, rgba(168,85,247,0.08) 50%, rgba(236,72,153,0.05) 100%)',
        border: '1px solid rgba(99,102,241,0.15)',
        marginBottom: 32,
        overflow: 'hidden',
      }}>
        {/* Decorative orbs */}
        <div style={{
          position: 'absolute',
          top: -60,
          right: -60,
          width: 200,
          height: 200,
          background: '#6366f1',
          borderRadius: '50%',
          filter: 'blur(100px)',
          opacity: 0.15,
        }} />
        <div style={{
          position: 'absolute',
          bottom: -40,
          left: '30%',
          width: 150,
          height: 150,
          background: '#a855f7',
          borderRadius: '50%',
          filter: 'blur(80px)',
          opacity: 0.1,
        }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <div style={{
              padding: '6px 14px',
              background: 'rgba(99,102,241,0.15)',
              borderRadius: 99,
              border: '1px solid rgba(99,102,241,0.25)',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}>
              <Zap size={14} color="#6366f1" fill="#6366f1" />
              <span style={{ fontSize: 12, fontWeight: 600, color: '#6366f1' }}>AI-Powered</span>
            </div>
          </div>

          <h1 style={{
            fontFamily: "'Outfit', sans-serif",
            fontSize: 40,
            fontWeight: 800,
            margin: '0 0 12px 0',
            background: 'linear-gradient(135deg, #f0f2f8 0%, #8591a8 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            lineHeight: 1.15,
            maxWidth: 600,
          }}>
            Your Intelligent Career Command Center
          </h1>

          <p style={{
            fontSize: 16,
            color: '#8591a8',
            maxWidth: 500,
            lineHeight: 1.7,
            margin: '0 0 28px 0',
          }}>
            Upload your resume, discover AI-matched opportunities, and accelerate your career with personalized intelligence.
          </p>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <Button
              type="primary"
              size="large"
              icon={<ArrowRight size={16} />}
              onClick={() => navigate('/upload')}
              style={{
                height: 48,
                padding: '0 28px',
                borderRadius: 12,
                fontSize: 15,
                fontWeight: 600,
              }}
            >
              Get Started
            </Button>
            <Button
              size="large"
              onClick={() => navigate('/search')}
              style={{
                height: 48,
                padding: '0 28px',
                borderRadius: 12,
                fontSize: 15,
              }}
            >
              Browse Jobs
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: 20,
        marginBottom: 32,
      }}>
        {stats.map((stat, i) => (
          <StatCard key={stat.label} {...stat} delay={i * 100} />
        ))}
      </div>

      {/* Quick Actions */}
      <h3 style={{
        fontFamily: "'Outfit', sans-serif",
        fontSize: 20,
        fontWeight: 600,
        color: '#f0f2f8',
        margin: '0 0 16px 0',
      }}>
        Quick Actions
      </h3>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: 20,
        marginBottom: 32,
      }}>
        {quickActions.map((action, i) => (
          <GlassCard
            key={action.title}
            onClick={() => navigate(action.path)}
            style={{ cursor: 'pointer', animationDelay: `${i * 100}ms` }}
            glowColor={action.color}
          >
            <div style={{
              width: 48,
              height: 48,
              borderRadius: 14,
              background: `${action.color}15`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 16,
            }}>
              <action.icon size={22} style={{ color: action.color }} />
            </div>
            <h4 style={{
              fontFamily: "'Outfit', sans-serif",
              fontSize: 17,
              fontWeight: 600,
              color: '#f0f2f8',
              margin: '0 0 8px 0',
            }}>
              {action.title}
            </h4>
            <p style={{
              fontSize: 13,
              color: '#8591a8',
              margin: 0,
              lineHeight: 1.6,
            }}>
              {action.description}
            </p>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              marginTop: 16,
              color: action.color,
              fontSize: 13,
              fontWeight: 600,
            }}>
              <span>Go</span>
              <ArrowRight size={14} />
            </div>
          </GlassCard>
        ))}
      </div>

      {/* How It Works + Recent Activity */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 20,
        marginBottom: 32,
      }}>
        {/* How it works */}
        <GlassCard hoverable={false}>
          <h3 style={{
            fontFamily: "'Outfit', sans-serif",
            fontSize: 18,
            fontWeight: 600,
            color: '#f0f2f8',
            margin: '0 0 24px 0',
          }}>
            How It Works
          </h3>
          {[
            { step: 1, title: 'Upload Resume', desc: 'We securely parse your experiences.', icon: FileText, color: '#6366f1' },
            { step: 2, title: 'AI Analysis', desc: 'Extract skills and context.', icon: Cpu, color: '#a855f7' },
            { step: 3, title: 'Job Match', desc: 'Discover jobs with AI reasoning.', icon: Search, color: '#22d3ee' },
          ].map((item, i) => (
            <div key={item.step} style={{
              display: 'flex',
              gap: 16,
              marginBottom: i < 2 ? 20 : 0,
              alignItems: 'flex-start',
              animation: 'slideUp 0.5s ease-out both',
              animationDelay: `${i * 120}ms`,
            }}>
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 4,
              }}>
                <div style={{
                  width: 40,
                  height: 40,
                  borderRadius: 12,
                  background: `${item.color}15`,
                  border: `1px solid ${item.color}30`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <item.icon size={18} style={{ color: item.color }} />
                </div>
                {i < 2 && (
                  <div style={{
                    width: 2,
                    height: 24,
                    background: 'linear-gradient(180deg, rgba(255,255,255,0.1), transparent)',
                    borderRadius: 1,
                  }} />
                )}
              </div>
              <div>
                <h4 style={{ margin: '0 0 4px', fontSize: 15, fontWeight: 600, color: '#f0f2f8' }}>
                  {item.title}
                </h4>
                <p style={{ margin: 0, fontSize: 13, color: '#8591a8' }}>{item.desc}</p>
              </div>
            </div>
          ))}
        </GlassCard>

        {/* Recent Activity */}
        <GlassCard hoverable={false}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <h3 style={{
              fontFamily: "'Outfit', sans-serif",
              fontSize: 18,
              fontWeight: 600,
              color: '#f0f2f8',
              margin: 0,
            }}>
              Recent Activity
            </h3>
            <Clock size={16} color="#5a6478" />
          </div>

          {recentActivity.map((item, i) => (
            <div key={i} style={{
              display: 'flex',
              gap: 14,
              padding: '12px 0',
              borderBottom: i < recentActivity.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
              animation: 'fadeIn 0.4s ease-out both',
              animationDelay: `${i * 80}ms`,
            }}>
              <div style={{
                width: 34,
                height: 34,
                borderRadius: 10,
                background: `${item.color}12`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}>
                <item.icon size={16} style={{ color: item.color }} />
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontSize: 13, color: '#f0f2f8', lineHeight: 1.4 }}>{item.text}</p>
                <span style={{ fontSize: 11, color: '#5a6478' }}>{item.time}</span>
              </div>
            </div>
          ))}
        </GlassCard>
      </div>
    </div>
  );
};

export default Dashboard;
