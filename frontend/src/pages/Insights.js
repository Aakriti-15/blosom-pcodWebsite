import React, { useState, useEffect, useCallback } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Cell, Legend, ResponsiveContainer,
  LineChart, Line,
} from 'recharts';
import { symptomAPI, cycleAPI } from '../utils/api';
import './Insights.css';

const COLORS = ['#fb7185','#e879f9','#f59e0b','#4ade80','#60a5fa','#a78bfa'];

const PERIOD_OPTIONS = [
  { label: '7 Days',  value: 7  },
  { label: '30 Days', value: 30 },
  { label: '90 Days', value: 90 },
];

const Insights = () => {
  const [period,        setPeriod]        = useState(30);
  const [symptomStats,  setSymptomStats]  = useState(null);
  const [cycleStats,    setCycleStats]    = useState(null);
  const [loading,       setLoading]       = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [sRes, cRes] = await Promise.all([
        symptomAPI.getStats({ days: period }),
        cycleAPI.getStats(),
      ]);
      setSymptomStats(sRes.data.stats);
      setCycleStats(cRes.data.stats);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Chart data ──
  const symptomChartData = symptomStats?.topSymptoms?.map((s) => ({
    name: s.name.replace(/_/g, ' '),
    count: s.count,
    frequency: s.frequency,
  })) || [];

  const moodChartData = symptomStats?.moodDistribution
    ? Object.entries(symptomStats.moodDistribution).map(([mood, count]) => ({
        name: mood,
        value: count,
      }))
    : [];

  const MOOD_EMOJI = {
    great: '😊', good: '🙂', okay: '😐', bad: '😔', terrible: '😢',
  };

  if (loading) {
    return (
      <div className="loading-center">
        <div className="spinner" />
        <p>Loading insights...</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">

      {/* ── Header ── */}
      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        marginBottom: 32,
        flexWrap: 'wrap',
        gap: 16,
      }}>
        <div>
          <h1 className="section-title">Insights</h1>
          <p className="section-subtitle">
            Understand your health patterns over time
          </p>
        </div>

        {/* Period tabs */}
        <div className="tabs">
          {PERIOD_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              className={`tab-btn ${period === opt.value ? 'tab-btn-active' : ''}`}
              onClick={() => setPeriod(opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Summary stat cards ── */}
      <div className="grid-4" style={{ marginBottom: 24 }}>
        {[
          {
            icon: '📋', iconBg: 'stat-icon-rose',
            value: symptomStats?.totalLogsInPeriod || 0,
            label: 'Total Entries',
          },
          {
            icon: '⚡', iconBg: 'stat-icon-gold',
            value: symptomStats?.averageEnergyLevel
              ? `${symptomStats.averageEnergyLevel}/10`
              : '—',
            label: 'Avg Energy',
          },
          {
            icon: '💤', iconBg: 'stat-icon-mauve',
            value: symptomStats?.averageSleepHours
              ? `${symptomStats.averageSleepHours}h`
              : '—',
            label: 'Avg Sleep',
          },
          {
            icon: '🌙', iconBg: 'stat-icon-sage',
            value: cycleStats?.totalCyclesLogged || 0,
            label: 'Cycles Tracked',
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

      {/* ── Top Symptoms Bar Chart ── */}
      <div className="insights-chart-card">
        <div className="insights-chart-title">Top Symptoms</div>
        <div className="insights-chart-sub">
          Most frequent symptoms in the last {period} days
        </div>
        {symptomChartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart
              data={symptomChartData}
              margin={{ top: 0, right: 0, left: -20, bottom: 60 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f7f3ee" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11, fill: '#a8998a' }}
                angle={-35}
                textAnchor="end"
              />
              <YAxis tick={{ fontSize: 11, fill: '#a8998a' }} />
              <Tooltip
                contentStyle={{
                  borderRadius: 12,
                  border: '1px solid #ffe4e6',
                  fontSize: 13,
                  fontFamily: 'Jost, sans-serif',
                }}
              />
              <Bar
                dataKey="count"
                fill="#fb7185"
                radius={[6,6,0,0]}
                name="Times logged"
              />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="empty-state">
            <div style={{ fontSize: 36, marginBottom: 8 }}>📊</div>
            <p>No symptom data for this period.<br />Start logging to see charts!</p>
          </div>
        )}
      </div>

      {/* ── Two column row ── */}
      <div className="insights-two-col">

        {/* Mood Pie Chart */}
        <div className="insights-chart-card" style={{ marginBottom: 0 }}>
          <div className="insights-chart-title">Mood Distribution</div>
          <div className="insights-chart-sub">
            How you've been feeling
          </div>
          {moodChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={moodChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {moodChartData.map((_, i) => (
                    <Cell
                      key={i}
                      fill={COLORS[i % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    borderRadius: 12,
                    border: '1px solid #ffe4e6',
                    fontSize: 13,
                    fontFamily: 'Jost, sans-serif',
                  }}
                  formatter={(value, name) => [
                    `${value} days`,
                    `${MOOD_EMOJI[name] || ''} ${name}`,
                  ]}
                />
                <Legend
                  formatter={(value) =>
                    `${MOOD_EMOJI[value] || ''} ${value}`
                  }
                  iconType="circle"
                  iconSize={8}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-state">
              <p>No mood data yet</p>
            </div>
          )}
        </div>

        {/* Cycle Analysis */}
        <div className="insights-chart-card" style={{ marginBottom: 0 }}>
          <div className="insights-chart-title">Cycle Analysis</div>
          <div className="insights-chart-sub">
            Based on your logged cycles
          </div>
          {cycleStats ? (
            <div className="cycle-analysis-grid">
              {[
                {
                  value: cycleStats.averageCycleLength
                    ? `${cycleStats.averageCycleLength}d`
                    : '—',
                  label: 'Avg Cycle',
                  badge: cycleStats.averageCycleLength >= 21 &&
                    cycleStats.averageCycleLength <= 35
                    ? { text: 'Normal', color: 'badge-sage' }
                    : cycleStats.averageCycleLength
                    ? { text: 'Irregular', color: 'badge-rose' }
                    : null,
                },
                {
                  value: cycleStats.averagePeriodLength
                    ? `${cycleStats.averagePeriodLength}d`
                    : '—',
                  label: 'Avg Period',
                },
                {
                  value: cycleStats.shortestCycle
                    ? `${cycleStats.shortestCycle}d`
                    : '—',
                  label: 'Shortest Cycle',
                },
                {
                  value: cycleStats.longestCycle
                    ? `${cycleStats.longestCycle}d`
                    : '—',
                  label: 'Longest Cycle',
                },
                {
                  value: cycleStats.irregularCycles || 0,
                  label: 'Irregular Cycles',
                },
                {
                  value: cycleStats.totalCyclesLogged || 0,
                  label: 'Total Logged',
                },
              ].map((item, i) => (
                <div className="cycle-analysis-item" key={i}>
                  <div className="cycle-analysis-value">{item.value}</div>
                  <div className="cycle-analysis-label">{item.label}</div>
                  {item.badge && (
                    <span
                      className={`badge ${item.badge.color}`}
                      style={{ marginTop: 6 }}
                    >
                      {item.badge.text}
                    </span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <p>No cycle data yet.<br />Log cycles to see analysis.</p>
            </div>
          )}
        </div>
      </div>

    </div>
  );
};

export default Insights;