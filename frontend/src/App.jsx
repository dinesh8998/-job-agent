import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider, theme } from 'antd';
import MainLayout from './components/Layout';
import Dashboard from './pages/Dashboard';
import UploadResume from './pages/UploadResume';
import JobSearch from './pages/JobSearch';
import StreamingResults from './pages/StreamingResults';
import CareerAdvice from './pages/CareerAdvice';
import Settings from './pages/Settings';
import Analytics from './pages/Analytics';

const App = () => {
  return (
    <ConfigProvider
      theme={{
        algorithm: theme.darkAlgorithm,
        token: {
          colorPrimary: '#6366f1',
          fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
          colorBgBase: '#0a0e1a',
          colorBgContainer: '#111827',
          colorBgElevated: '#1a2035',
          colorBorderSecondary: 'rgba(255, 255, 255, 0.06)',
          colorBorder: 'rgba(255, 255, 255, 0.08)',
          colorText: '#f0f2f8',
          colorTextSecondary: '#8591a8',
          borderRadius: 10,
          controlHeight: 40,
        },
        components: {
          Menu: {
            itemBg: 'transparent',
            itemSelectedBg: 'rgba(99, 102, 241, 0.12)',
            itemSelectedColor: '#6366f1',
            itemColor: '#8591a8',
            itemHoverColor: '#f0f2f8',
            itemHoverBg: 'rgba(255, 255, 255, 0.04)',
          },
          Button: {
            primaryShadow: '0 2px 8px rgba(99, 102, 241, 0.3)',
          },
          Input: {
            activeBorderColor: '#6366f1',
            hoverBorderColor: 'rgba(99, 102, 241, 0.4)',
          },
          Card: {
            colorBgContainer: 'transparent',
          },
        },
      }}
    >
      <Router>
        <Routes>
          <Route path="/" element={<MainLayout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="upload" element={<UploadResume />} />
            <Route path="search" element={<JobSearch />} />
            <Route path="results" element={<StreamingResults />} />
            <Route path="career-advice" element={<CareerAdvice />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Routes>
      </Router>
    </ConfigProvider>
  );
};

export default App;
