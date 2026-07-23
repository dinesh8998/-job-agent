import React, { useState } from 'react';
import { Input, Button, Switch, message, Divider } from 'antd';
import { Settings as SettingsIcon, User, Key, Bell, Palette, Shield, Save } from 'lucide-react';
import GlassCard from '../components/GlassCard';
import PageHeader from '../components/PageHeader';

const Settings = () => {
  const [profile, setProfile] = useState({
    name: 'Dinesh Kumar',
    email: 'dinesh@example.com',
    preferredRole: 'Security Analyst',
  });
  const [apiUrl, setApiUrl] = useState('http://localhost:8000');
  const [notifications, setNotifications] = useState({
    newJobs: true,
    weeklyReport: true,
    careerTips: false,
  });

  const handleSave = () => {
    message.success('Settings saved successfully!');
  };

  const settingSections = [
    {
      icon: User,
      title: 'Profile Information',
      description: 'Your personal details and preferences.',
      color: '#6366f1',
      content: (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 20 }}>
          <div>
            <label style={{ fontSize: 13, color: '#8591a8', fontWeight: 500, display: 'block', marginBottom: 6 }}>
              Full Name
            </label>
            <Input
              value={profile.name}
              onChange={(e) => setProfile({ ...profile, name: e.target.value })}
              style={{
                borderRadius: 10,
                height: 42,
                background: 'rgba(17, 24, 39, 0.5)',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
            />
          </div>
          <div>
            <label style={{ fontSize: 13, color: '#8591a8', fontWeight: 500, display: 'block', marginBottom: 6 }}>
              Email
            </label>
            <Input
              value={profile.email}
              onChange={(e) => setProfile({ ...profile, email: e.target.value })}
              style={{
                borderRadius: 10,
                height: 42,
                background: 'rgba(17, 24, 39, 0.5)',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
            />
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={{ fontSize: 13, color: '#8591a8', fontWeight: 500, display: 'block', marginBottom: 6 }}>
              Preferred Job Role
            </label>
            <Input
              value={profile.preferredRole}
              onChange={(e) => setProfile({ ...profile, preferredRole: e.target.value })}
              placeholder="e.g. Security Analyst, DevOps Engineer"
              style={{
                borderRadius: 10,
                height: 42,
                background: 'rgba(17, 24, 39, 0.5)',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
            />
          </div>
        </div>
      ),
    },
    {
      icon: Key,
      title: 'API Configuration',
      description: 'Backend server connection settings.',
      color: '#22d3ee',
      content: (
        <div style={{ marginTop: 20 }}>
          <label style={{ fontSize: 13, color: '#8591a8', fontWeight: 500, display: 'block', marginBottom: 6 }}>
            Backend URL
          </label>
          <Input
            value={apiUrl}
            onChange={(e) => setApiUrl(e.target.value)}
            placeholder="http://localhost:8000"
            style={{
              borderRadius: 10,
              height: 42,
              background: 'rgba(17, 24, 39, 0.5)',
              border: '1px solid rgba(255,255,255,0.08)',
              maxWidth: 400,
            }}
          />
          <div style={{
            marginTop: 12,
            padding: '10px 14px',
            background: 'rgba(34, 211, 238, 0.06)',
            border: '1px solid rgba(34, 211, 238, 0.12)',
            borderRadius: 10,
            maxWidth: 400,
          }}>
            <p style={{ margin: 0, fontSize: 12, color: '#22d3ee' }}>
              💡 Make sure the Python backend is running before using features like Upload, Search, and Career Advice.
            </p>
          </div>
        </div>
      ),
    },
    {
      icon: Bell,
      title: 'Notifications',
      description: 'Control what notifications you receive.',
      color: '#fbbf24',
      content: (
        <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {[
            { key: 'newJobs', label: 'New Job Matches', desc: 'Get notified when new jobs match your profile' },
            { key: 'weeklyReport', label: 'Weekly Report', desc: 'Receive a weekly summary of your job search activity' },
            { key: 'careerTips', label: 'Career Tips', desc: 'Get AI-powered career development suggestions' },
          ].map((item) => (
            <div key={item.key} style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '12px 16px',
              background: 'rgba(0,0,0,0.15)',
              borderRadius: 12,
              border: '1px solid rgba(255,255,255,0.04)',
            }}>
              <div>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 500, color: '#f0f2f8' }}>{item.label}</p>
                <p style={{ margin: '2px 0 0', fontSize: 12, color: '#5a6478' }}>{item.desc}</p>
              </div>
              <Switch
                checked={notifications[item.key]}
                onChange={(checked) => setNotifications({ ...notifications, [item.key]: checked })}
              />
            </div>
          ))}
        </div>
      ),
    },
    {
      icon: Palette,
      title: 'Appearance',
      description: 'Customize the look and feel.',
      color: '#a855f7',
      content: (
        <div style={{ marginTop: 20 }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '12px 16px',
            background: 'rgba(0,0,0,0.15)',
            borderRadius: 12,
            border: '1px solid rgba(255,255,255,0.04)',
          }}>
            <div>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 500, color: '#f0f2f8' }}>Dark Mode</p>
              <p style={{ margin: '2px 0 0', fontSize: 12, color: '#5a6478' }}>Currently the only theme — more coming soon!</p>
            </div>
            <Switch checked={true} disabled />
          </div>

          {/* Color accents */}
          <div style={{ marginTop: 16 }}>
            <p style={{ fontSize: 13, color: '#8591a8', fontWeight: 500, marginBottom: 10 }}>
              Accent Color
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              {['#6366f1', '#22d3ee', '#a855f7', '#34d399', '#fb7185', '#fbbf24'].map((color) => (
                <button key={color} style={{
                  width: 32,
                  height: 32,
                  borderRadius: 10,
                  background: color,
                  border: color === '#6366f1' ? '2px solid #fff' : '2px solid transparent',
                  cursor: 'pointer',
                  transition: 'all 200ms ease',
                  boxShadow: `0 0 12px ${color}40`,
                }}
                  title={`Accent: ${color}`}
                />
              ))}
            </div>
          </div>
        </div>
      ),
    },
  ];

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <PageHeader
        icon={SettingsIcon}
        title="Settings"
        subtitle="Manage your profile, preferences, and application settings."
      >
        <Button
          type="primary"
          icon={<Save size={14} />}
          onClick={handleSave}
          style={{ borderRadius: 10, height: 40, fontWeight: 600 }}
        >
          Save Changes
        </Button>
      </PageHeader>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {settingSections.map((section, i) => (
          <GlassCard
            key={section.title}
            hoverable={false}
            glowColor={section.color}
            style={{ animationDelay: `${i * 80}ms` }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background: `${section.color}12`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}>
                <section.icon size={20} style={{ color: section.color }} />
              </div>
              <div>
                <h3 style={{
                  fontFamily: "'Outfit', sans-serif",
                  fontSize: 17,
                  fontWeight: 600,
                  color: '#f0f2f8',
                  margin: 0,
                }}>
                  {section.title}
                </h3>
                <p style={{ fontSize: 13, color: '#5a6478', margin: 0 }}>
                  {section.description}
                </p>
              </div>
            </div>
            {section.content}
          </GlassCard>
        ))}
      </div>
    </div>
  );
};

export default Settings;
