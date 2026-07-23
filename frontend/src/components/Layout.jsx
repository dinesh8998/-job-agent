import React, { useState } from 'react';
import { Layout, Menu, Typography, theme, Avatar, Tooltip } from 'antd';
import { Link, useLocation, Outlet } from 'react-router-dom';
import { 
  LayoutDashboard, Upload, Search, MessageSquareCode, Compass, 
  Settings, BarChart3, Bell, ChevronLeft, ChevronRight, Zap
} from 'lucide-react';
import AnimatedBackground from './AnimatedBackground';

const { Header, Content, Sider } = Layout;

const MainLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const { token } = theme.useToken();

  const menuItems = [
    {
      key: '/dashboard',
      icon: <LayoutDashboard size={18} />,
      label: <Link to="/dashboard">Dashboard</Link>,
    },
    {
      key: '/upload',
      icon: <Upload size={18} />,
      label: <Link to="/upload">Upload Resume</Link>,
    },
    {
      key: '/search',
      icon: <Search size={18} />,
      label: <Link to="/search">Job Search</Link>,
    },
    {
      key: '/results',
      icon: <MessageSquareCode size={18} />,
      label: <Link to="/results">AI Stream</Link>,
    },
    {
      key: '/career-advice',
      icon: <Compass size={18} />,
      label: <Link to="/career-advice">Career Advice</Link>,
    },
    {
      key: '/analytics',
      icon: <BarChart3 size={18} />,
      label: <Link to="/analytics">Analytics</Link>,
    },
    {
      key: '/settings',
      icon: <Settings size={18} />,
      label: <Link to="/settings">Settings</Link>,
    },
  ];

  const pageTitles = {
    '/dashboard': 'Dashboard',
    '/upload': 'Upload Resume',
    '/search': 'Job Search',
    '/results': 'AI Stream',
    '/career-advice': 'Career Advice',
    '/analytics': 'Analytics',
    '/settings': 'Settings',
  };

  const currentTitle = pageTitles[location.pathname] || 'Dashboard';

  return (
    <Layout className="app-container">
      <AnimatedBackground />

      {/* Sidebar */}
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={(value) => setCollapsed(value)}
        width={272}
        collapsedWidth={80}
        trigger={null}
        style={{
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          zIndex: 100,
          transition: 'all 250ms cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        {/* Logo */}
        <div style={{
          padding: collapsed ? '24px 16px' : '24px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          borderBottom: '1px solid rgba(255,255,255,0.04)',
          marginBottom: 8,
          transition: 'all 250ms ease',
        }}>
          <div className="sidebar-logo pulse-glow" style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            background: 'linear-gradient(135deg, #6366f1, #a855f7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            boxShadow: '0 4px 16px rgba(99, 102, 241, 0.3)',
          }}>
            <Zap size={20} color="#fff" fill="#fff" />
          </div>
          {!collapsed && (
            <div className="slide-in-left" style={{ overflow: 'hidden', whiteSpace: 'nowrap' }}>
              <Typography.Title level={4} style={{
                margin: 0,
                fontFamily: "'Outfit', sans-serif",
                fontSize: 18,
                fontWeight: 700,
                background: 'linear-gradient(135deg, #f0f2f8, #8591a8)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}>
                JobFlow AI
              </Typography.Title>
              <span style={{ fontSize: 11, color: '#5a6478', letterSpacing: '0.5px' }}>
                Career Intelligence
              </span>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div style={{ padding: '0 8px', flex: 1 }}>
          <Menu
            mode="inline"
            selectedKeys={[location.pathname]}
            items={menuItems}
            style={{ border: 'none' }}
          />
        </div>

        {/* Collapse Toggle */}
        <div style={{
          padding: '12px 16px',
          borderTop: '1px solid rgba(255,255,255,0.04)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'space-between',
        }}>
          {!collapsed && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Avatar size={32} style={{
                background: 'linear-gradient(135deg, #6366f1, #a855f7)',
                fontSize: 13,
                fontWeight: 600,
              }}>
                DK
              </Avatar>
              <div>
                <div style={{ fontSize: 13, fontWeight: 500, color: '#f0f2f8', lineHeight: 1.2 }}>Dinesh Kumar</div>
                <div style={{ fontSize: 11, color: '#5a6478' }}>Pro Plan</div>
              </div>
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 8,
              width: 32,
              height: 32,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#8591a8',
              transition: 'all 200ms ease',
              flexShrink: 0,
            }}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>
      </Sider>

      {/* Main Content Area */}
      <Layout style={{
        marginLeft: collapsed ? 80 : 272,
        transition: 'margin-left 250ms cubic-bezier(0.4, 0, 0.2, 1)',
        position: 'relative',
        zIndex: 1,
      }}>
        {/* Top Header */}
        <Header style={{
          padding: '0 32px',
          background: 'rgba(10, 14, 26, 0.75)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255,255,255,0.04)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: 64,
          position: 'sticky',
          top: 0,
          zIndex: 50,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{
              fontSize: 14,
              color: '#5a6478',
            }}>
              Home
            </span>
            <span style={{ color: '#5a6478', fontSize: 12 }}>/</span>
            <span style={{
              fontSize: 14,
              fontWeight: 600,
              color: '#f0f2f8',
            }}>
              {currentTitle}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Tooltip title="Notifications">
              <button style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 10,
                width: 38,
                height: 38,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: '#8591a8',
                position: 'relative',
                transition: 'all 200ms ease',
              }}>
                <Bell size={16} />
                <span style={{
                  position: 'absolute',
                  top: 8,
                  right: 8,
                  width: 7,
                  height: 7,
                  borderRadius: '50%',
                  background: '#fb7185',
                  border: '2px solid rgba(10, 14, 26, 0.9)',
                }} />
              </button>
            </Tooltip>
          </div>
        </Header>

        {/* Content */}
        <Content style={{
          padding: '28px 32px',
          minHeight: 'calc(100vh - 64px)',
          overflow: 'auto',
        }}>
          <div className="page-transition" key={location.pathname}>
            <Outlet />
          </div>
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout;
