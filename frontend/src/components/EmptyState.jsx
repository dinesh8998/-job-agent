import React from 'react';
import { Button } from 'antd';

const EmptyState = ({ icon: Icon, title, description, actionLabel, onAction, iconColor = '#6366f1' }) => {
  return (
    <div className="empty-state-root">
      <div className="empty-state-icon-container">
        <div className="empty-state-glow" style={{ background: iconColor }} />
        {Icon && <Icon size={48} style={{ color: iconColor, opacity: 0.5 }} />}
      </div>
      <h3 className="empty-state-title">{title}</h3>
      {description && <p className="empty-state-desc">{description}</p>}
      {actionLabel && onAction && (
        <Button
          type="primary"
          size="large"
          onClick={onAction}
          style={{ marginTop: 8, borderRadius: 10 }}
        >
          {actionLabel}
        </Button>
      )}

      <style>{`
        .empty-state-root {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 64px 24px;
          text-align: center;
          animation: fadeIn 0.6s ease-out;
        }

        .empty-state-icon-container {
          position: relative;
          margin-bottom: 24px;
          animation: float 6s ease-in-out infinite;
        }

        .empty-state-glow {
          position: absolute;
          width: 100px;
          height: 100px;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          border-radius: 50%;
          filter: blur(40px);
          opacity: 0.15;
        }

        .empty-state-title {
          font-family: 'Outfit', sans-serif;
          font-size: 18px;
          font-weight: 600;
          color: #f0f2f8;
          margin: 0 0 8px 0;
        }

        .empty-state-desc {
          font-size: 14px;
          color: #8591a8;
          max-width: 340px;
          margin: 0;
          line-height: 1.6;
        }

        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-12px); }
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default EmptyState;
