import React, { useState, useEffect, useRef } from 'react';
import { BarChart3, Target, TrendingUp, Calendar, Briefcase, Clock, Zap } from 'lucide-react';
import GlassCard from '../components/GlassCard';
import PageHeader from '../components/PageHeader';

/* ── Skill Radar Chart (Pure SVG) ──────────────────────────────────── */
const RadarChart = ({ data }) => {
  const [animProgress, setAnimProgress] = useState(0);
  const ref = useRef(null);
  const size = 240;
  const cx = size / 2;
  const cy = size / 2;
  const maxR = 90;
  const levels = 4;

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        let start = performance.now();
        const animate = (t) => {
          const p = Math.min((t - start) / 1000, 1);
          setAnimProgress(1 - Math.pow(1 - p, 3));
          if (p < 1) requestAnimationFrame(animate);
        };
        requestAnimationFrame(animate);
      }
    }, { threshold: 0.3 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  const n = data.length;
  const angleStep = (2 * Math.PI) / n;

  const getPoint = (i, value) => {
    const angle = i * angleStep - Math.PI / 2;
    const r = (value / 100) * maxR * animProgress;
    return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
  };

  const dataPoints = data.map((d, i) => getPoint(i, d.value));
  const polygonStr = dataPoints.map(p => `${p.x},${p.y}`).join(' ');

  return (
    <svg ref={ref} width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {/* Grid circles */}
      {Array.from({ length: levels }).map((_, i) => (
        <circle key={i} cx={cx} cy={cy} r={maxR * ((i + 1) / levels)}
          fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
      ))}
      {/* Axes */}
      {data.map((_, i) => {
        const angle = i * angleStep - Math.PI / 2;
        return (
          <line key={i}
            x1={cx} y1={cy}
            x2={cx + maxR * Math.cos(angle)} y2={cy + maxR * Math.sin(angle)}
            stroke="rgba(255,255,255,0.04)" strokeWidth="1"
          />
        );
      })}
      {/* Data polygon */}
      <polygon points={polygonStr}
        fill="rgba(99, 102, 241, 0.15)" stroke="#6366f1" strokeWidth="2"
        style={{ filter: 'drop-shadow(0 0 6px rgba(99,102,241,0.3))' }}
      />
      {/* Data points */}
      {dataPoints.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="4"
          fill="#6366f1" stroke="#0a0e1a" strokeWidth="2" />
      ))}
      {/* Labels */}
      {data.map((d, i) => {
        const angle = i * angleStep - Math.PI / 2;
        const lx = cx + (maxR + 24) * Math.cos(angle);
        const ly = cy + (maxR + 24) * Math.sin(angle);
        return (
          <text key={i} x={lx} y={ly}
            textAnchor="middle" dominantBaseline="middle"
            fill="#8591a8" fontSize="10" fontWeight="500"
          >
            {d.label}
          </text>
        );
      })}
    </svg>
  );
};

/* ── Animated Bar Chart ──────────────────────────────────────────────── */
const BarChartViz = ({ data }) => {
  const [animProgress, setAnimProgress] = useState(0);
  const ref = useRef(null);
  const maxVal = Math.max(...data.map(d => d.value));

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        let start = performance.now();
        const animate = (t) => {
          const p = Math.min((t - start) / 800, 1);
          setAnimProgress(1 - Math.pow(1 - p, 3));
          if (p < 1) requestAnimationFrame(animate);
        };
        requestAnimationFrame(animate);
      }
    }, { threshold: 0.3 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  return (
    <div ref={ref} style={{ display: 'flex', alignItems: 'flex-end', gap: 12, height: 160, padding: '0 8px' }}>
      {data.map((item, i) => {
        const height = (item.value / maxVal) * 140 * animProgress;
        return (
          <div key={i} style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 8,
          }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: '#f0f2f8' }}>{item.value}</span>
            <div style={{
              width: '100%',
              maxWidth: 40,
              height,
              borderRadius: '8px 8px 4px 4px',
              background: `linear-gradient(180deg, ${item.color || '#6366f1'}, ${item.color || '#6366f1'}80)`,
              transition: 'height 800ms cubic-bezier(0.4, 0, 0.2, 1)',
              boxShadow: `0 0 12px ${item.color || '#6366f1'}30`,
            }} />
            <span style={{ fontSize: 10, color: '#5a6478', textAlign: 'center' }}>{item.label}</span>
          </div>
        );
      })}
    </div>
  );
};

/* ── Activity Heatmap ────────────────────────────────────────────────── */
const ActivityHeatmap = () => {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const weeks = 8;
  const data = Array.from({ length: days.length * weeks }, () => Math.floor(Math.random() * 5));

  const getColor = (val) => {
    if (val === 0) return 'rgba(255,255,255,0.03)';
    if (val === 1) return 'rgba(99,102,241,0.15)';
    if (val === 2) return 'rgba(99,102,241,0.3)';
    if (val === 3) return 'rgba(99,102,241,0.5)';
    return 'rgba(99,102,241,0.75)';
  };

  return (
    <div>
      <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
        <div style={{ width: 28 }} />
        {Array.from({ length: weeks }).map((_, i) => (
          <div key={i} style={{
            flex: 1,
            textAlign: 'center',
            fontSize: 10,
            color: '#5a6478',
          }}>
            W{i + 1}
          </div>
        ))}
      </div>
      {days.map((day, di) => (
        <div key={day} style={{ display: 'flex', gap: 4, marginBottom: 4, alignItems: 'center' }}>
          <span style={{ width: 28, fontSize: 10, color: '#5a6478', textAlign: 'right', paddingRight: 4 }}>
            {day}
          </span>
          {Array.from({ length: weeks }).map((_, wi) => {
            const val = data[di * weeks + wi];
            return (
              <div key={wi} style={{
                flex: 1,
                aspectRatio: '1',
                maxHeight: 20,
                borderRadius: 4,
                background: getColor(val),
                transition: 'all 200ms ease',
                cursor: 'default',
              }}
                title={`${val} activities`}
              />
            );
          })}
        </div>
      ))}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'flex-end', marginTop: 8 }}>
        <span style={{ fontSize: 10, color: '#5a6478' }}>Less</span>
        {[0, 1, 2, 3, 4].map(v => (
          <div key={v} style={{
            width: 12, height: 12, borderRadius: 3,
            background: getColor(v),
          }} />
        ))}
        <span style={{ fontSize: 10, color: '#5a6478' }}>More</span>
      </div>
    </div>
  );
};

/* ── Main Analytics Page ─────────────────────────────────────────────── */
const Analytics = () => {
  const radarData = [
    { label: 'Security', value: 90 },
    { label: 'Python', value: 75 },
    { label: 'Cloud', value: 45 },
    { label: 'DevOps', value: 55 },
    { label: 'ML/AI', value: 30 },
    { label: 'Network', value: 85 },
  ];

  const marketTrends = [
    { label: 'Security\nAnalyst', value: 340, color: '#6366f1' },
    { label: 'DevOps\nEngineer', value: 280, color: '#22d3ee' },
    { label: 'Cloud\nArchitect', value: 220, color: '#a855f7' },
    { label: 'Pen\nTester', value: 190, color: '#34d399' },
    { label: 'Data\nEngineer', value: 250, color: '#fbbf24' },
    { label: 'SRE', value: 170, color: '#fb7185' },
  ];

  const applicationTimeline = [
    { date: 'Jun 14', applied: 3, interviews: 1, status: 'active' },
    { date: 'Jun 12', applied: 2, interviews: 0, status: 'pending' },
    { date: 'Jun 10', applied: 5, interviews: 2, status: 'active' },
    { date: 'Jun 8', applied: 1, interviews: 1, status: 'completed' },
    { date: 'Jun 5', applied: 4, interviews: 0, status: 'pending' },
  ];

  const summaryStats = [
    { icon: Briefcase, label: 'Total Applications', value: '47', color: '#6366f1' },
    { icon: Target, label: 'Interview Rate', value: '23%', color: '#34d399' },
    { icon: TrendingUp, label: 'Profile Views', value: '128', color: '#22d3ee' },
    { icon: Zap, label: 'Response Rate', value: '68%', color: '#a855f7' },
  ];

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      <PageHeader
        icon={BarChart3}
        title="Analytics"
        subtitle="Track your job search performance and skill market insights."
      />

      {/* Summary Stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: 16,
        marginBottom: 28,
      }}>
        {summaryStats.map((stat, i) => (
          <GlassCard key={stat.label} style={{ animationDelay: `${i * 80}ms` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{
                width: 42,
                height: 42,
                borderRadius: 12,
                background: `${stat.color}12`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <stat.icon size={20} style={{ color: stat.color }} />
              </div>
              <div>
                <p style={{ fontSize: 12, color: '#5a6478', margin: 0, fontWeight: 500 }}>
                  {stat.label}
                </p>
                <p style={{
                  fontFamily: "'Outfit', sans-serif",
                  fontSize: 26,
                  fontWeight: 700,
                  color: '#f0f2f8',
                  margin: 0,
                  lineHeight: 1.1,
                }}>
                  {stat.value}
                </p>
              </div>
            </div>
          </GlassCard>
        ))}
      </div>

      {/* Charts Row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 20,
        marginBottom: 24,
      }}>
        {/* Skill Coverage Radar */}
        <GlassCard hoverable={false}>
          <h3 style={{
            fontFamily: "'Outfit', sans-serif",
            fontSize: 17,
            fontWeight: 600,
            color: '#f0f2f8',
            margin: '0 0 8px 0',
          }}>
            Skill Coverage
          </h3>
          <p style={{ fontSize: 12, color: '#5a6478', margin: '0 0 16px' }}>
            Your profile strength across key domains
          </p>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <RadarChart data={radarData} />
          </div>
        </GlassCard>

        {/* Job Market Trends */}
        <GlassCard hoverable={false}>
          <h3 style={{
            fontFamily: "'Outfit', sans-serif",
            fontSize: 17,
            fontWeight: 600,
            color: '#f0f2f8',
            margin: '0 0 8px 0',
          }}>
            Job Market Trends
          </h3>
          <p style={{ fontSize: 12, color: '#5a6478', margin: '0 0 24px' }}>
            Open positions by role (this month)
          </p>
          <BarChartViz data={marketTrends} />
        </GlassCard>
      </div>

      {/* Bottom Row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 20,
      }}>
        {/* Application Timeline */}
        <GlassCard hoverable={false}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <Calendar size={16} color="#6366f1" />
            <h3 style={{
              fontFamily: "'Outfit', sans-serif",
              fontSize: 17,
              fontWeight: 600,
              color: '#f0f2f8',
              margin: 0,
            }}>
              Application Timeline
            </h3>
          </div>

          {applicationTimeline.map((item, i) => (
            <div key={i} className="fade-in" style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 14px',
              background: 'rgba(0,0,0,0.12)',
              borderRadius: 10,
              marginBottom: i < applicationTimeline.length - 1 ? 8 : 0,
              border: '1px solid rgba(255,255,255,0.03)',
              animationDelay: `${i * 60}ms`,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: item.status === 'active' ? '#34d399' : item.status === 'completed' ? '#6366f1' : '#fbbf24',
                }} />
                <span style={{ fontSize: 13, color: '#8591a8' }}>{item.date}</span>
              </div>
              <div style={{ display: 'flex', gap: 16 }}>
                <span style={{ fontSize: 12, color: '#f0f2f8' }}>
                  <Briefcase size={12} style={{ marginRight: 4, verticalAlign: 'middle' }} />
                  {item.applied} applied
                </span>
                <span style={{ fontSize: 12, color: '#34d399' }}>
                  {item.interviews} interviews
                </span>
              </div>
            </div>
          ))}
        </GlassCard>

        {/* Activity Heatmap */}
        <GlassCard hoverable={false}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <Clock size={16} color="#a855f7" />
            <h3 style={{
              fontFamily: "'Outfit', sans-serif",
              fontSize: 17,
              fontWeight: 600,
              color: '#f0f2f8',
              margin: 0,
            }}>
              Weekly Activity
            </h3>
          </div>
          <ActivityHeatmap />
        </GlassCard>
      </div>
    </div>
  );
};

export default Analytics;
