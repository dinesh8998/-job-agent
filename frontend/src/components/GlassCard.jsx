import React from 'react';

const GlassCard = ({ 
  children, 
  className = '', 
  style = {}, 
  glowColor = null,
  hoverable = true,
  padding = '24px',
  onClick = null,
  animate = true,
}) => {
  const glowStyle = glowColor ? {
    '--glow': glowColor,
  } : {};

  return (
    <div
      className={`glass-card-wrapper ${hoverable ? 'glass-card-hoverable' : ''} ${animate ? 'fade-in' : ''} ${className}`}
      style={{ ...glowStyle, ...style }}
      onClick={onClick}
    >
      <div className="glass-card-inner" style={{ padding }}>
        {children}
      </div>
      {glowColor && <div className="glass-card-glow" />}

      <style>{`
        .glass-card-wrapper {
          position: relative;
          background: rgba(17, 24, 39, 0.5);
          backdrop-filter: blur(20px) saturate(1.5);
          -webkit-backdrop-filter: blur(20px) saturate(1.5);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 16px;
          overflow: hidden;
          transition: all 250ms cubic-bezier(0.4, 0, 0.2, 1);
        }

        .glass-card-hoverable {
          cursor: default;
        }

        .glass-card-hoverable:hover {
          border-color: rgba(255, 255, 255, 0.12);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3), 0 0 40px rgba(99, 102, 241, 0.08);
          transform: translateY(-2px);
        }

        .glass-card-wrapper[onclick]:hover,
        .glass-card-wrapper[style*="cursor"]:hover {
          cursor: pointer;
        }

        .glass-card-inner {
          position: relative;
          z-index: 1;
        }

        .glass-card-glow {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 1px;
          background: linear-gradient(90deg, transparent, var(--glow, rgba(99,102,241,0.5)), transparent);
          opacity: 0;
          transition: opacity 250ms ease;
        }

        .glass-card-hoverable:hover .glass-card-glow {
          opacity: 1;
        }
      `}</style>
    </div>
  );
};

export default GlassCard;
