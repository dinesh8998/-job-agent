import React, { useState } from 'react';
import { MapPin, Building, ExternalLink, ChevronDown, ChevronUp, Star, Briefcase, Clock } from 'lucide-react';
import SkillBadge from './SkillBadge';

const SOURCE_COLORS = {
  linkedin: { bg: 'rgba(10, 102, 194, 0.12)', color: '#0a66c2', border: 'rgba(10, 102, 194, 0.25)' },
  naukri: { bg: 'rgba(77, 126, 250, 0.12)', color: '#4d7efa', border: 'rgba(77, 126, 250, 0.25)' },
  foundit: { bg: 'rgba(108, 99, 255, 0.12)', color: '#6c63ff', border: 'rgba(108, 99, 255, 0.25)' },
  indeed: { bg: 'rgba(44, 90, 246, 0.12)', color: '#2c5af6', border: 'rgba(44, 90, 246, 0.25)' },
};

const JobCard = ({ job, delay = 0 }) => {
  const [expanded, setExpanded] = useState(false);

  const scoreColor = job.score >= 90 ? '#34d399' : job.score >= 75 ? '#6366f1' : '#fbbf24';
  const circumference = 2 * Math.PI * 36;
  const strokeDashoffset = circumference - (job.score / 100) * circumference;

  return (
    <div
      className="job-card-root"
      style={{
        animationDelay: `${delay}ms`,
        borderColor: job.topMatch ? 'rgba(52, 211, 153, 0.3)' : undefined,
      }}
    >
      {job.topMatch && <div className="job-card-top-badge">⭐ Top Match</div>}

      <div className="job-card-body">
        {/* Left: Info */}
        <div className="job-card-info">
          <div className="job-card-company-icon" style={{ background: `${scoreColor}12` }}>
            <Briefcase size={22} style={{ color: scoreColor }} />
          </div>
          <div className="job-card-details">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <h3 className="job-card-title">{job.title}</h3>
              {job.source && (
                <span className="job-card-source-badge" style={{
                  background: (SOURCE_COLORS[job.source] || SOURCE_COLORS.linkedin).bg,
                  color: (SOURCE_COLORS[job.source] || SOURCE_COLORS.linkedin).color,
                  border: `1px solid ${(SOURCE_COLORS[job.source] || SOURCE_COLORS.linkedin).border}`,
                }}>
                  {job.source}
                </span>
              )}
            </div>
            <div className="job-card-meta">
              <span className="job-card-meta-item">
                <Building size={14} /> {job.company}
              </span>
              <span className="job-card-meta-item">
                <MapPin size={14} /> {job.location || 'Not specified'}
              </span>
              {job.experience && (
                <span className="job-card-meta-item">
                  <Clock size={14} /> {job.experience}
                </span>
              )}
            </div>
            <div className="job-card-tags">
              {(job.tags || []).map((tag, i) => (
                <SkillBadge key={tag} skill={tag} size="small" delay={delay + i * 60} />
              ))}
            </div>
          </div>
        </div>

        {/* Right: Score Ring */}
        <div className="job-card-score-section">
          <div className="job-card-score-ring">
            <svg width="84" height="84" viewBox="0 0 84 84">
              <circle cx="42" cy="42" r="36" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="5" />
              <circle
                cx="42" cy="42" r="36"
                fill="none"
                stroke={scoreColor}
                strokeWidth="5"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                transform="rotate(-90 42 42)"
                className="job-card-score-circle"
                style={{ animationDelay: `${delay + 200}ms` }}
              />
            </svg>
            <span className="job-card-score-value" style={{ color: scoreColor }}>
              {job.score}%
            </span>
          </div>
          <span className="job-card-score-label">Match</span>
        </div>
      </div>

      {/* Expandable Reasoning */}
      <div className="job-card-actions">
        <button className="job-card-reasoning-toggle" onClick={() => setExpanded(!expanded)}>
          <Star size={14} style={{ color: '#fbbf24' }} />
          <span>AI Reasoning</span>
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>

        {job.url && (
          <a
            href={job.url}
            target="_blank"
            rel="noopener noreferrer"
            className="job-card-apply-btn"
          >
            <ExternalLink size={14} />
            Apply
          </a>
        )}
      </div>

      {expanded && (
        <div className="job-card-reasoning fade-in">
          <p>{job.reasoning}</p>
        </div>
      )}

      <style>{`
        .job-card-root {
          position: relative;
          background: rgba(17, 24, 39, 0.5);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 16px;
          padding: 24px;
          animation: slideUp 0.5s ease-out both;
          transition: all 250ms ease;
          overflow: hidden;
        }

        .job-card-root:hover {
          border-color: rgba(255, 255, 255, 0.12);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
          transform: translateY(-2px);
        }

        .job-card-top-badge {
          position: absolute;
          top: 12px;
          right: 16px;
          background: rgba(52, 211, 153, 0.12);
          color: #34d399;
          font-size: 12px;
          font-weight: 600;
          padding: 4px 12px;
          border-radius: 9999px;
          border: 1px solid rgba(52, 211, 153, 0.2);
        }

        .job-card-body {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 20px;
        }

        .job-card-info {
          display: flex;
          gap: 16px;
          flex: 1;
          min-width: 0;
        }

        .job-card-company-icon {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .job-card-details {
          min-width: 0;
        }

        .job-card-title {
          font-family: 'Outfit', sans-serif;
          font-size: 18px;
          font-weight: 600;
          color: #f0f2f8;
          margin: 0 0 8px 0;
        }

        .job-card-meta {
          display: flex;
          gap: 16px;
          flex-wrap: wrap;
          margin-bottom: 12px;
        }

        .job-card-meta-item {
          display: flex;
          align-items: center;
          gap: 5px;
          font-size: 13px;
          color: #8591a8;
        }

        .job-card-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }

        .job-card-score-section {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          flex-shrink: 0;
        }

        .job-card-score-ring {
          position: relative;
          width: 84px;
          height: 84px;
        }

        .job-card-score-circle {
          animation: scoreReveal 1.2s ease-out both;
        }

        @keyframes scoreReveal {
          from { stroke-dashoffset: ${circumference}; }
        }

        .job-card-score-value {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          font-family: 'Outfit', sans-serif;
          font-size: 20px;
          font-weight: 700;
        }

        .job-card-score-label {
          font-size: 11px;
          color: #8591a8;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .job-card-source-badge {
          padding: 2px 10px;
          border-radius: 99px;
          font-size: 10px;
          font-weight: 600;
          text-transform: capitalize;
          letter-spacing: 0.3px;
          flex-shrink: 0;
        }

        .job-card-actions {
          display: flex;
          gap: 10px;
          margin-top: 16px;
          align-items: stretch;
        }

        .job-card-reasoning-toggle {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 14px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 8px;
          color: #8591a8;
          cursor: pointer;
          font-size: 13px;
          font-weight: 500;
          transition: all 200ms ease;
          flex: 1;
        }

        .job-card-reasoning-toggle:hover {
          background: rgba(255, 255, 255, 0.06);
          color: #f0f2f8;
        }

        .job-card-apply-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 20px;
          background: linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(34, 211, 238, 0.10));
          border: 1px solid rgba(99, 102, 241, 0.25);
          border-radius: 8px;
          color: #6366f1;
          font-size: 13px;
          font-weight: 600;
          text-decoration: none;
          transition: all 250ms ease;
          white-space: nowrap;
        }

        .job-card-apply-btn:hover {
          background: linear-gradient(135deg, rgba(99, 102, 241, 0.25), rgba(34, 211, 238, 0.18));
          color: #818cf8;
          border-color: rgba(99, 102, 241, 0.4);
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(99, 102, 241, 0.2);
        }

        .job-card-reasoning {
          margin-top: 12px;
          padding: 16px;
          background: rgba(0, 0, 0, 0.2);
          border-radius: 10px;
          border-left: 3px solid #fbbf24;
        }

        .job-card-reasoning p {
          margin: 0;
          font-size: 13px;
          line-height: 1.7;
          color: #8591a8;
        }

        @keyframes slideUp {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default JobCard;
