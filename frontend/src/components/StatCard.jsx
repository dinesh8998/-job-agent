import React, { useState, useEffect, useRef } from 'react';

const StatCard = ({
  icon: Icon,
  label,
  value,
  suffix = '',
  trend = null,
  trendLabel = '',
  accentColor = '#6366f1',
  delay = 0,
}) => {
  const [displayValue, setDisplayValue] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isVisible) return;
    const numValue = typeof value === 'number' ? value : parseInt(value, 10);
    if (isNaN(numValue)) {
      setDisplayValue(value);
      return;
    }

    const duration = 1200;
    const startTime = performance.now();
    const delayMs = delay;

    const timeout = setTimeout(() => {
      const animate = (currentTime) => {
        const elapsed = currentTime - startTime - delayMs;
        if (elapsed < 0) {
          requestAnimationFrame(animate);
          return;
        }
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        setDisplayValue(Math.floor(eased * numValue));
        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };
      requestAnimationFrame(animate);
    }, delayMs);

    return () => clearTimeout(timeout);
  }, [isVisible, value, delay]);

  return (
    <div ref={ref} className="stat-card-root" style={{ animationDelay: `${delay}ms` }}>
      <div className="stat-card-accent" style={{ background: accentColor }} />
      <div className="stat-card-icon-wrap" style={{ background: `${accentColor}15` }}>
        {Icon && <Icon size={22} style={{ color: accentColor }} />}
      </div>
      <p className="stat-card-label">{label}</p>
      <div className="stat-card-value-row">
        <span className="stat-card-value">{displayValue}{suffix}</span>
        {trend !== null && (
          <span className={`stat-card-trend ${trend >= 0 ? 'positive' : 'negative'}`}>
            {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}% {trendLabel}
          </span>
        )}
      </div>

      <style>{`
        .stat-card-root {
          position: relative;
          background: rgba(17, 24, 39, 0.5);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 16px;
          padding: 24px;
          overflow: hidden;
          animation: fadeIn 0.6s ease-out both;
          transition: all 250ms ease;
        }

        .stat-card-root:hover {
          border-color: rgba(255, 255, 255, 0.1);
          transform: translateY(-3px);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        }

        .stat-card-accent {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 3px;
          opacity: 0.7;
        }

        .stat-card-icon-wrap {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 16px;
        }

        .stat-card-label {
          font-size: 13px;
          font-weight: 500;
          color: #8591a8;
          margin: 0 0 6px 0;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .stat-card-value-row {
          display: flex;
          align-items: baseline;
          gap: 10px;
        }

        .stat-card-value {
          font-family: 'Outfit', sans-serif;
          font-size: 32px;
          font-weight: 700;
          color: #f0f2f8;
          line-height: 1;
        }

        .stat-card-trend {
          font-size: 12px;
          font-weight: 600;
          padding: 2px 8px;
          border-radius: 99px;
        }

        .stat-card-trend.positive {
          background: rgba(52, 211, 153, 0.12);
          color: #34d399;
        }

        .stat-card-trend.negative {
          background: rgba(251, 113, 133, 0.12);
          color: #fb7185;
        }
      `}</style>
    </div>
  );
};

export default StatCard;
