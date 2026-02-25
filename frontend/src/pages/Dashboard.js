import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { cycleAPI, symptomAPI } from '../utils/api';
import { format, differenceInDays } from 'date-fns';
import './Dashboard.css';

// ── Constants ──────────────────────────────────
const MOOD_META = {
  great:   { emoji: '😊', color: '#22c55e' },
  good:    { emoji: '🙂', color: '#84cc16' },
  okay:    { emoji: '😐', color: '#f59e0b' },
  bad:     { emoji: '😔', color: '#f97316' },
  terrible:{ emoji: '😢', color: '#ef4444' },
};

const TIPS = [
  { icon: '🥗', text: 'Eat anti-inflammatory foods like leafy greens and berries'   },
  { icon: '🏃', text: 'Light exercise 30 min daily helps regulate hormones'          },
  { icon: '💤', text: 'Aim for 7-9 hours of quality sleep every night'              },
  { icon: '💧', text: 'Drink 8+ glasses of water to reduce bloating'                },
  { icon: '🧘', text: 'Manage stress with meditation or deep breathing'              },
  { icon: '☀️', text: 'Get morning sunlight to support your circadian rhythm'       },
];

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
};

// ── Dashboard Component ─────────────────────────
const Dashboard = () => {
  const { user } = useAuth();
  const navigate  = useNavigate();

  const [cycleData,   setCycleData]   = useState(null);
  const [symptomStats, setSymptomStats] = useState(null);
  const [recentLogs,  setRecentLogs]  = useState([]);
  const [loading,     setLoading]     = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [cycleRes, statsRes, logsRes] = await Promise.all([
        cycleAPI.getAll({ limit: 6 }),
        symptomAPI.getStats({ days: 30 }),
        symptomAPI.getAll({ limit: 5 }),
      ]);

      setCycleData(cycleRes.data);
      setSymptomStats(statsRes.data.stats);
      setRecentLogs(logsRes.data.logs || []);
    } catch (err) {
      console.error('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Prediction data ──
  const prediction = cycleData?.prediction;
  const daysUntil  = prediction
    ? differenceInDays(
        new Date(prediction.predictedStartDate),
        new Date()
      )
    : null;

  const isUrgent  = daysUntil !== null && daysUntil <= 3 && daysUntil >= 0;
  const isPast    = daysUntil !== null && daysUntil < 0;

  // ── Cycle stats ──
  const cycles        = cycleData?.cycles || [];
  const actualCycles  = cycles.filter((c) => !c.isPredicted);
  const avgCycle      = actualCycles.length
    ? Math.round(
        actualCycles.filter((c) => c.cycleLength)
          .reduce((s, c) => s + c.cycleLength, 0) /
        (actualCycles.filter((c) => c.cycleLength).length || 1)
      )
    : '—';

  const irregularCount = actualCycles.filter(
    (c) => c.cycleLength && (c.cycleLength < 21 || c.cycleLength > 35)
  ).length;

  // ── Mood distribution ──
  const moodDist  = symptomStats?.moodDistribution || {};
  const totalLogs = symptomStats?.totalLogsInPeriod || 0;

  if (loading) {
    return (
      <div className="loading-center">
        <div className="spinner" />
        <p>Loading your dashboard...</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">

      {/* ── Header ── */}
      <div className="dash-header">
        <div>
          <h1 className="dash-greeting">
            {getGreeting()},{' '}
            <span>{user?.name?.split(' ')[0] || 'there'}</span> 🌸
          </h1>
          <p className="dash-date">
            {format(new Date(), 'EEEE, MMMM d, yyyy')}
          </p>
        </div>
        <div className="dash-header-actions">
          <button
            className="btn btn-primary btn-sm"
            onClick={() => navigate('/symptoms')}
          >
            + Log Today
          </button>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => navigate('/cycles')}
          >
            + Log Cycle
          </button>
        </div>
      </div>

      {/* ── Prediction Banner ── */}
      <div className={`prediction-banner ${isUrgent ? 'urgent' : ''} ${!prediction ? 'no-data' : ''}`}>
        <div className="prediction-banner-grid" />

        <div className="prediction-left">
          <div className="prediction-icon-wrap">
            {isUrgent ? '🔴' : isPast ? '⏰' : '🌙'}
          </div>
          <div>
            <div className="prediction-label">Next Period</div>
            <div className="prediction-value">
              {prediction
                ? isPast
                  ? 'Period may have started'
                  : daysUntil === 0
                  ? 'Expected today!'
                  : `In ${daysUntil} day${daysUntil !== 1 ? 's' : ''}`
                : 'Log cycles to predict'}
            </div>
            <div className="prediction-sub">
              {prediction
                ? format(new Date(prediction.predictedStartDate), 'MMMM d, yyyy')
                : 'Start tracking your cycle below'}
            </div>
          </div>
        </div>

        {prediction && (
          <div className="prediction-right">
            <div className="prediction-stat">
              <div className="prediction-stat-value">
                {prediction.predictedCycleLength}d
              </div>
              <div className="prediction-stat-label">Cycle Length</div>
            </div>
            <div className="prediction-stat">
              <div className="prediction-stat-value">
                {cycleData?.total || 0}
              </div>
              <div className="prediction-stat-label">Cycles Logged</div>
            </div>
            <div className="prediction-confidence">
              {prediction.confidence === 'high'   ? '✦ High Confidence'   :
               prediction.confidence === 'medium' ? '◈ Medium Confidence' :
                                                    '◇ Low Confidence'}
            </div>
          </div>
        )}
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid-4" style={{ marginBottom: 24 }}>
        {[
          {
            icon:  '🌙',
            iconBg: 'stat-icon-rose',
            value: cycleData?.total || 0,
            label: 'Cycles Logged',
          },
          {
            icon:  '📅',
            iconBg: 'stat-icon-sage',
            value: avgCycle === '—' ? '—' : `${avgCycle}d`,
            label: 'Avg Cycle Length',
          },
          {
            icon:  '📋',
            iconBg: 'stat-icon-mauve',
            value: totalLogs,
            label: 'Logs This Month',
          },
          {
            icon:  '⚠️',
            iconBg: 'stat-icon-gold',
            value: irregularCount,
            label: 'Irregular Cycles',
          },
        ].map((s, i) => (
          <div className="stat-card" key={i}>
            <div className={`stat-icon ${s.iconBg}`}>{s.icon}</div>
            <div>
              <div className="stat-value">{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Two Column Row ── */}
      <div className="dash-two-col">

        {/* Top Symptoms */}
        <div>
          <div className="dash-section-header">
            <h2 className="dash-section-title">Top Symptoms</h2>
            <span
              className="dash-section-link"
              onClick={() => navigate('/insights')}
            >
              View insights →
            </span>
          </div>

          <div className="symptom-chart-card">
            {symptomStats?.topSymptoms?.length ? (
              symptomStats.topSymptoms.slice(0, 6).map((s) => (
                <div className="symptom-bar-row" key={s.name}>
                  <span className="symptom-bar-name">
                    {s.name.replace(/_/g, ' ')}
                  </span>
                  <div className="symptom-bar-track">
                    <div
                      className="symptom-bar-fill"
                      style={{ width: `${s.frequency}%` }}
                    />
                  </div>
                  <span className="symptom-bar-pct">{s.frequency}%</span>
                </div>
              ))
            ) : (
              <div className="empty-state">
                <div style={{ fontSize: 32, marginBottom: 8 }}>📋</div>
                <p>No symptoms logged yet.<br />Start tracking to see patterns.</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Logs */}
        <div>
          <div className="dash-section-header">
            <h2 className="dash-section-title">Recent Logs</h2>
            <span
              className="dash-section-link"
              onClick={() => navigate('/symptoms')}
            >
              View all →
            </span>
          </div>

          {recentLogs.length ? (
            recentLogs.map((log) => (
              <div
                className="log-card"
                key={log._id}
                onClick={() => navigate('/symptoms')}
              >
                {/* Date badge */}
                <div className="log-date-badge">
                  <div className="log-date-day">
                    {format(new Date(log.date), 'd')}
                  </div>
                  <div className="log-date-mon">
                    {format(new Date(log.date), 'MMM')}
                  </div>
                </div>

                {/* Mood */}
                <div className="log-mood-emoji">
                  {MOOD_META[log.mood]?.emoji || '😐'}
                </div>

                {/* Info */}
                <div className="log-info">
                  <div style={{
                    fontSize: 13,
                    fontWeight: 500,
                    color: 'var(--text-primary)',
                    textTransform: 'capitalize',
                  }}>
                    {log.mood} day
                  </div>
                  <div className="log-symptoms">
                    {log.symptoms?.slice(0, 3).map((s) => (
                      <span className="log-symptom-chip" key={s.name}>
                        {s.name.replace(/_/g, ' ')}
                      </span>
                    ))}
                    {log.symptoms?.length > 3 && (
                      <span className="log-symptom-chip">
                        +{log.symptoms.length - 3}
                      </span>
                    )}
                  </div>
                </div>

                {/* Meta */}
                <div className="log-meta">
                  <span className="log-energy">
                    ⚡ {log.energyLevel}/10
                  </span>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    💤 {log.sleepHours}h
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="empty-state">
              <div style={{ fontSize: 32, marginBottom: 8 }}>🌸</div>
              <p>No logs yet.<br />Start logging your daily symptoms!</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Mood Distribution ── */}
      <div style={{ marginBottom: 24 }}>
        <div className="dash-section-header">
          <h2 className="dash-section-title">Mood This Month</h2>
          <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 300 }}>
            Last 30 days
          </span>
        </div>

        <div className="mood-grid">
          {Object.entries(MOOD_META).map(([mood, meta]) => (
            <div className="mood-bubble" key={mood}>
              <div className="mood-bubble-emoji">{meta.emoji}</div>
              <div className="mood-bubble-count">
                {moodDist[mood] || 0}
              </div>
              <div className="mood-bubble-label">{mood}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Wellness Tips ── */}
      <div>
        <div className="dash-section-header">
          <h2 className="dash-section-title">PCOD Wellness Tips</h2>
        </div>

        <div className="tips-card">
          <div className="tips-grid">
            {TIPS.map((tip, i) => (
              <div className="tip-item" key={i}>
                <span className="tip-icon">{tip.icon}</span>
                <span className="tip-text">{tip.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
};

export default Dashboard;