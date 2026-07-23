import React, { useState } from 'react';
import { Typography, Input, Button, Tag } from 'antd';
import { Search as SearchIcon, Activity, Sliders, MapPin, Wifi } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import GlassCard from '../components/GlassCard';
import JobCard from '../components/JobCard';
import EmptyState from '../components/EmptyState';

const { Paragraph } = Typography;

const SUGGESTION_CHIPS = [
  'Security Analyst Remote',
  'Penetration Tester NYC',
  'SOC Engineer',
  'Cloud Security Architect',
  'Threat Hunter',
  'DFIR Specialist',
];

const JobSearch = () => {
  const [query, setQuery] = useState('');
  const [jobLocation, setJobLocation] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleSearch = async (searchQuery) => {
    const q = searchQuery || query;
    if (!q.trim()) return;
    setQuery(q);
    setLoading(true);
    setError(null);
    setResults(null);
    setStats(null);

    try {
      const res = await fetch('http://localhost:8000/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q, location: jobLocation }),
      });

      if (!res.ok) {
        throw new Error(`Server error: ${res.status}`);
      }

      const data = await res.json();
      setResults(data.results || []);
      setStats(data.stats || null);
    } catch (err) {
      console.error('Job search failed:', err);
      setError(err.message || 'Failed to search jobs. Is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  const handleDeepDive = () => {
    const deepDiveQuery = jobLocation ? `${query} in ${jobLocation}` : query;
    navigate('/results', { state: { query: deepDiveQuery } });
  };

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto' }}>
      {/* Header Section */}
      <div className="fade-in" style={{ textAlign: 'center', marginBottom: 40 }}>
        <div style={{
          width: 64,
          height: 64,
          borderRadius: 18,
          background: 'linear-gradient(135deg, rgba(34,211,238,0.15), rgba(99,102,241,0.15))',
          border: '1px solid rgba(34,211,238,0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 20px',
        }}>
          <SearchIcon size={28} color="#22d3ee" />
        </div>

        <h2 style={{
          fontFamily: "'Outfit', sans-serif",
          fontSize: 32,
          fontWeight: 700,
          margin: '0 0 12px',
          background: 'linear-gradient(135deg, #f0f2f8, #8591a8)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}>
          Find Your Next Opportunity
        </h2>
        <Paragraph style={{
          fontSize: 15,
          color: '#8591a8',
          maxWidth: 500,
          margin: '0 auto',
          lineHeight: 1.7,
        }}>
          Enter your desired role. Our AI searches live listings and matches them against your unique skills profile.
        </Paragraph>

        {/* Search Bar */}
        <div style={{
          display: 'flex',
          gap: 12,
          marginTop: 28,
          maxWidth: 800,
          margin: '28px auto 0',
        }}>
          <Input
            id="job-search-input"
            size="large"
            placeholder="e.g. Senior Security Analyst"
            prefix={<SearchIcon size={18} color="#5a6478" style={{ marginRight: 8 }} />}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onPressEnter={() => handleSearch()}
            style={{
              borderRadius: 12,
              height: 50,
              fontSize: 15,
              background: 'rgba(17, 24, 39, 0.6)',
              border: '1px solid rgba(255,255,255,0.08)',
              flex: 2,
            }}
          />
          <Input
            id="location-input"
            size="large"
            placeholder="Location (e.g. Ireland, Remote)"
            prefix={<MapPin size={18} color="#5a6478" style={{ marginRight: 8 }} />}
            value={jobLocation}
            onChange={(e) => setJobLocation(e.target.value)}
            onPressEnter={() => handleSearch()}
            style={{
              borderRadius: 12,
              height: 50,
              fontSize: 15,
              background: 'rgba(17, 24, 39, 0.6)',
              border: '1px solid rgba(255,255,255,0.08)',
              flex: 1,
            }}
          />
          <Button
            id="job-search-submit"
            type="primary"
            size="large"
            onClick={() => handleSearch()}
            loading={loading}
            style={{
              height: 50,
              padding: '0 32px',
              borderRadius: 12,
              fontSize: 15,
              fontWeight: 600,
            }}
          >
            Search
          </Button>
        </div>

        {/* Suggestion Chips */}
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          gap: 8,
          marginTop: 16,
        }}>
          {SUGGESTION_CHIPS.map((chip) => (
            <button
              key={chip}
              onClick={() => { setQuery(chip); handleSearch(chip); }}
              style={{
                padding: '6px 14px',
                borderRadius: 99,
                border: '1px solid rgba(255,255,255,0.06)',
                background: 'rgba(255,255,255,0.03)',
                color: '#8591a8',
                fontSize: 12,
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 200ms ease',
              }}
              onMouseEnter={(e) => {
                e.target.style.borderColor = 'rgba(99,102,241,0.3)';
                e.target.style.color = '#6366f1';
                e.target.style.background = 'rgba(99,102,241,0.06)';
              }}
              onMouseLeave={(e) => {
                e.target.style.borderColor = 'rgba(255,255,255,0.06)';
                e.target.style.color = '#8591a8';
                e.target.style.background = 'rgba(255,255,255,0.03)';
              }}
            >
              {chip}
            </button>
          ))}
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="fade-in" style={{ textAlign: 'center', padding: '60px 0' }}>
          <div className="pulse-glow" style={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            background: 'rgba(34, 211, 238, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px',
          }}>
            <SearchIcon size={28} color="#22d3ee" className="pulse" />
          </div>
          <p style={{ color: '#8591a8', fontSize: 15 }}>Scraping LinkedIn, Naukri, Foundit & Indeed...</p>
          <p style={{ color: '#5a6478', fontSize: 12 }}>Matching jobs against your profile</p>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="fade-in" style={{
          textAlign: 'center',
          padding: '40px 20px',
          background: 'rgba(239, 68, 68, 0.06)',
          border: '1px solid rgba(239, 68, 68, 0.15)',
          borderRadius: 16,
        }}>
          <p style={{ color: '#ef4444', fontSize: 16, fontWeight: 600, margin: '0 0 8px' }}>
            Search Failed
          </p>
          <p style={{ color: '#8591a8', fontSize: 13, margin: 0 }}>{error}</p>
          <Button
            type="primary"
            size="small"
            onClick={() => handleSearch()}
            style={{ marginTop: 16, borderRadius: 8 }}
          >
            Retry
          </Button>
        </div>
      )}

      {/* Results */}
      {results && results.length > 0 && !loading && (
        <div className="fade-in">
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 12,
            flexWrap: 'wrap',
            gap: 12,
          }}>
            <div>
              <h3 style={{
                fontFamily: "'Outfit', sans-serif",
                fontSize: 20,
                fontWeight: 600,
                color: '#f0f2f8',
                margin: 0,
              }}>
                AI Matches
              </h3>
              <p style={{ fontSize: 13, color: '#5a6478', margin: '4px 0 0' }}>
                {results.length} jobs matched to your profile
              </p>
            </div>
            <Button
              icon={<Activity size={14} />}
              onClick={handleDeepDive}
              style={{ borderRadius: 10 }}
            >
              Live AI Stream
            </Button>
          </div>

          {/* Source Stats Bar */}
          {stats && stats.sources && (
            <div style={{
              display: 'flex',
              gap: 12,
              marginBottom: 20,
              flexWrap: 'wrap',
              alignItems: 'center',
            }}>
              {Object.entries(stats.sources).map(([source, count]) => (
                <div key={source} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '4px 12px',
                  borderRadius: 99,
                  background: count > 0 ? 'rgba(52, 211, 153, 0.08)' : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${count > 0 ? 'rgba(52, 211, 153, 0.15)' : 'rgba(255,255,255,0.06)'}`,
                  fontSize: 11,
                  fontWeight: 500,
                  color: count > 0 ? '#34d399' : '#5a6478',
                  textTransform: 'capitalize',
                }}>
                  <Wifi size={10} />
                  {source}: {count}
                </div>
              ))}
              {stats.cache_hit && (
                <div style={{
                  padding: '4px 10px',
                  borderRadius: 99,
                  background: 'rgba(251, 191, 36, 0.08)',
                  border: '1px solid rgba(251, 191, 36, 0.15)',
                  fontSize: 11,
                  fontWeight: 500,
                  color: '#fbbf24',
                }}>
                  ⚡ Cached
                </div>
              )}
              {stats.scrape_time_ms > 0 && (
                <span style={{ fontSize: 11, color: '#5a6478' }}>
                  {(stats.scrape_time_ms / 1000).toFixed(1)}s
                </span>
              )}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {results.map((job, i) => (
              <JobCard key={job.id || i} job={job} delay={i * 120} />
            ))}
          </div>
        </div>
      )}

      {/* Empty Results */}
      {results && results.length === 0 && !loading && (
        <EmptyState
          icon={SearchIcon}
          title="No Jobs Found"
          description={`No matching jobs found for "${query}". Try a different search term or broader keywords.`}
          iconColor="#fbbf24"
        />
      )}

      {/* Initial Empty State */}
      {!results && !loading && !error && (
        <EmptyState
          icon={SearchIcon}
          title="Start Your Job Search"
          description="Enter a job title or role above to discover AI-matched opportunities from LinkedIn, Naukri, Foundit & Indeed."
          iconColor="#22d3ee"
        />
      )}
    </div>
  );
};

export default JobSearch;

