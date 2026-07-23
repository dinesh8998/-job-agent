import React from 'react';

const PageHeader = ({ icon: Icon, title, subtitle, gradient = true, children }) => {
  return (
    <div className="page-header-root">
      <div className="page-header-content">
        {Icon && (
          <div className="page-header-icon-wrap">
            <Icon size={28} />
          </div>
        )}
        <div>
          <h2 className={`page-header-title ${gradient ? 'gradient-text-static' : ''}`}>
            {title}
          </h2>
          {subtitle && (
            <p className="page-header-subtitle">{subtitle}</p>
          )}
        </div>
      </div>
      {children && <div className="page-header-actions">{children}</div>}

      <style>{`
        .page-header-root {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 32px;
          animation: slideUp 0.5s ease-out;
          gap: 16px;
          flex-wrap: wrap;
        }

        .page-header-content {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .page-header-icon-wrap {
          width: 52px;
          height: 52px;
          border-radius: 14px;
          background: linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(168, 85, 247, 0.15));
          border: 1px solid rgba(99, 102, 241, 0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #6366f1;
          flex-shrink: 0;
        }

        .page-header-title {
          font-family: 'Outfit', sans-serif;
          font-size: 28px;
          font-weight: 700;
          margin: 0;
          line-height: 1.2;
        }

        .gradient-text-static {
          background: linear-gradient(135deg, #6366f1, #a855f7, #ec4899);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .page-header-subtitle {
          font-size: 14px;
          color: #8591a8;
          margin: 4px 0 0 0;
          max-width: 500px;
          line-height: 1.5;
        }

        .page-header-actions {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        @keyframes slideUp {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default PageHeader;
