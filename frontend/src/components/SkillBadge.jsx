import React from 'react';

const CATEGORY_COLORS = {
  security: { bg: 'rgba(34, 211, 238, 0.1)', border: 'rgba(34, 211, 238, 0.25)', text: '#22d3ee' },
  programming: { bg: 'rgba(168, 85, 247, 0.1)', border: 'rgba(168, 85, 247, 0.25)', text: '#a855f7' },
  cloud: { bg: 'rgba(52, 211, 153, 0.1)', border: 'rgba(52, 211, 153, 0.25)', text: '#34d399' },
  data: { bg: 'rgba(251, 191, 36, 0.1)', border: 'rgba(251, 191, 36, 0.25)', text: '#fbbf24' },
  tools: { bg: 'rgba(251, 113, 133, 0.1)', border: 'rgba(251, 113, 133, 0.25)', text: '#fb7185' },
  default: { bg: 'rgba(99, 102, 241, 0.1)', border: 'rgba(99, 102, 241, 0.25)', text: '#6366f1' },
};

const SECURITY_KEYWORDS = ['security', 'siem', 'threat', 'incident', 'penetration', 'vulnerability', 'forensic', 'soc', 'firewall', 'ids', 'ips', 'malware', 'encryption'];
const PROGRAMMING_KEYWORDS = ['python', 'javascript', 'java', 'react', 'node', 'typescript', 'sql', 'c++', 'go', 'rust', 'ruby', 'php', 'html', 'css', 'api'];
const CLOUD_KEYWORDS = ['aws', 'azure', 'gcp', 'cloud', 'docker', 'kubernetes', 'devops', 'terraform', 'ci/cd'];
const DATA_KEYWORDS = ['data', 'analytics', 'machine learning', 'ai', 'ml', 'deep learning', 'tensorflow'];

function getCategory(skill) {
  const lower = skill.toLowerCase();
  if (SECURITY_KEYWORDS.some(kw => lower.includes(kw))) return 'security';
  if (PROGRAMMING_KEYWORDS.some(kw => lower.includes(kw))) return 'programming';
  if (CLOUD_KEYWORDS.some(kw => lower.includes(kw))) return 'cloud';
  if (DATA_KEYWORDS.some(kw => lower.includes(kw))) return 'data';
  return 'default';
}

const SkillBadge = ({ skill, closable = false, onClose, delay = 0, size = 'default' }) => {
  const category = getCategory(skill);
  const colors = CATEGORY_COLORS[category];
  const isSmall = size === 'small';

  return (
    <span
      className="skill-badge-root"
      style={{
        background: colors.bg,
        borderColor: colors.border,
        color: colors.text,
        animationDelay: `${delay}ms`,
        padding: isSmall ? '3px 10px' : '5px 14px',
        fontSize: isSmall ? '12px' : '13px',
      }}
    >
      <span className="skill-badge-dot" style={{ background: colors.text }} />
      <span>{skill}</span>
      {closable && (
        <button
          className="skill-badge-close"
          onClick={(e) => { e.stopPropagation(); onClose?.(skill); }}
          style={{ color: colors.text }}
          aria-label={`Remove ${skill}`}
        >
          ×
        </button>
      )}

      <style>{`
        .skill-badge-root {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          border-radius: 9999px;
          border: 1px solid;
          font-weight: 500;
          animation: scaleIn 0.35s ease-out both;
          transition: all 200ms ease;
          white-space: nowrap;
        }

        .skill-badge-root:hover {
          filter: brightness(1.2);
          transform: scale(1.03);
        }

        .skill-badge-dot {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          flex-shrink: 0;
        }

        .skill-badge-close {
          background: none;
          border: none;
          cursor: pointer;
          font-size: 16px;
          line-height: 1;
          padding: 0 0 0 2px;
          opacity: 0.6;
          transition: opacity 150ms;
        }

        .skill-badge-close:hover {
          opacity: 1;
        }

        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.8); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </span>
  );
};

export default SkillBadge;
