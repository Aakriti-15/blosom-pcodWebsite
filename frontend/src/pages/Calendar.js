import React, { useState, useEffect, useCallback } from 'react';
import { cycleAPI, symptomAPI } from '../utils/api';
import {
  format, startOfMonth, endOfMonth, startOfWeek,
  endOfWeek, addDays, addMonths, subMonths,
  isSameMonth, isSameDay, isWithinInterval,
  parseISO,
} from 'date-fns';
import './Calendar.css';

const MOOD_EMOJI = {
  great: '😊', good: '🙂', okay: '😐', bad: '😔', terrible: '😢',
};

const Calendar = () => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay,  setSelectedDay]  = useState(null);
  const [cycles,       setCycles]       = useState([]);
  const [prediction,   setPrediction]   = useState(null);
  const [logs,         setLogs]         = useState([]);
  const [loading,      setLoading]      = useState(true);

  // ── Fetch data ──
  const fetchData = useCallback(async () => {
    try {
      const [cycleRes, logRes] = await Promise.all([
        cycleAPI.getAll({ limit: 12 }),
        symptomAPI.getAll({ limit: 60 }),
      ]);
      setCycles(cycleRes.data.cycles   || []);
      setPrediction(cycleRes.data.prediction);
      setLogs(logRes.data.logs         || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Check if day is a period day ──
  const isPeriodDay = (date) => {
    return cycles.some((cycle) => {
      if (!cycle.endDate) {
        return isSameDay(parseISO(cycle.startDate), date);
      }
      return isWithinInterval(date, {
        start: parseISO(cycle.startDate),
        end:   parseISO(cycle.endDate),
      });
    });
  };

  // ── Check if day is predicted ──
  const isPredictedDay = (date) => {
    if (!prediction) return false;
    const predStart = parseISO(
      prediction.predictedStartDate.toString().split('T')[0]
    );
    const avgPeriod = 5;
    const predEnd = addDays(predStart, avgPeriod);
    try {
      return isWithinInterval(date, { start: predStart, end: predEnd });
    } catch {
      return false;
    }
  };

  // ── Get flow for a day ──
  const getFlowForDay = (date) => {
    const cycle = cycles.find((c) => {
      if (!c.endDate) return isSameDay(parseISO(c.startDate), date);
      return isWithinInterval(date, {
        start: parseISO(c.startDate),
        end:   parseISO(c.endDate),
      });
    });
    return cycle?.flowIntensity || null;
  };

  // ── Get log for a day ──
  const getLogForDay = (date) => {
    return logs.find((log) =>
      isSameDay(parseISO(log.date.toString().split('T')[0]), date)
    );
  };

  // ── Build calendar days ──
  const buildCalendarDays = () => {
    const monthStart  = startOfMonth(currentMonth);
    const monthEnd    = endOfMonth(currentMonth);
    const calStart    = startOfWeek(monthStart, { weekStartsOn: 1 });
    const calEnd      = endOfWeek(monthEnd,     { weekStartsOn: 1 });

    const days = [];
    let day = calStart;
    while (day <= calEnd) {
      days.push(day);
      day = addDays(day, 1);
    }
    return days;
  };

  const days   = buildCalendarDays();
  const today  = new Date();

  // ── Selected day data ──
  const selectedLog    = selectedDay ? getLogForDay(selectedDay)    : null;
  const selectedFlow   = selectedDay ? getFlowForDay(selectedDay)   : null;
  const selectedIsPred = selectedDay ? isPredictedDay(selectedDay)  : false;

  if (loading) {
    return (
      <div className="loading-center">
        <div className="spinner" />
        <p>Loading calendar...</p>
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
          <h1 className="section-title">Period Calendar</h1>
          <p className="section-subtitle">
            Visual overview of your cycle history and predictions
          </p>
        </div>
      </div>

      {/* ── Calendar ── */}
      <div className="calendar-wrapper">

        {/* Header */}
        <div className="calendar-header">
          <button
            className="calendar-nav-btn"
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
          >
            ‹
          </button>
          <div className="calendar-month-label">
            {format(currentMonth, 'MMMM yyyy')}
          </div>
          <button
            className="calendar-nav-btn"
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
          >
            ›
          </button>
        </div>

        {/* Day names */}
        <div className="calendar-day-names">
          {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map((d) => (
            <div className="calendar-day-name" key={d}>{d}</div>
          ))}
        </div>

        {/* Grid */}
        <div className="calendar-grid">
          {days.map((day, idx) => {
            const isToday      = isSameDay(day, today);
            const isThisMonth  = isSameMonth(day, currentMonth);
            const isPeriod     = isPeriodDay(day);
            const isPredicted  = isPredictedDay(day);
            const hasLog       = !!getLogForDay(day);
            const isSelected   = selectedDay && isSameDay(day, selectedDay);
            const flow         = getFlowForDay(day);

            let dayClass = 'calendar-day';
            if (!isThisMonth) dayClass += ' other-month';
            if (isToday)      dayClass += ' today';
            if (isPeriod)     dayClass += ' period-day';
            else if (isPredicted) dayClass += ' predicted-day';

            return (
              <div
                key={idx}
                className={dayClass}
                onClick={() =>
                  setSelectedDay(
                    selectedDay && isSameDay(day, selectedDay) ? null : day
                  )
                }
                style={isSelected ? {
                  outline: '2px solid var(--rose-400)',
                  outlineOffset: '-2px',
                } : {}}
              >
                <div className="day-number">
                  {format(day, 'd')}
                </div>

                <div className="day-indicators">
                  {isPeriod && (
                    <div className="day-dot day-dot-period" />
                  )}
                  {isPredicted && !isPeriod && (
                    <div className="day-dot day-dot-predicted" />
                  )}
                  {hasLog && (
                    <div className="day-dot day-dot-log" />
                  )}
                </div>

                {isPeriod && isThisMonth && (
                  <div className="day-label day-label-period">
                    {flow || 'period'}
                  </div>
                )}
                {isPredicted && !isPeriod && isThisMonth && (
                  <div className="day-label day-label-predicted">
                    predicted
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="calendar-legend">
          <div className="legend-item">
            <div
              className="legend-swatch"
              style={{ background: 'linear-gradient(135deg, #fff1f2, #ffe4e6)' }}
            />
            Period days
          </div>
          <div className="legend-item">
            <div
              className="legend-swatch"
              style={{ background: 'linear-gradient(135deg, #fdf4ff, #fae8ff)' }}
            />
            Predicted period
          </div>
          <div className="legend-item">
            <div className="day-dot day-dot-log" style={{ width: 10, height: 10 }} />
            Symptom log
          </div>
          <div className="legend-item">
            <div
              className="day-number"
              style={{
                background: 'linear-gradient(135deg, #fb7185, #f43f5e)',
                color: 'white',
                width: 20,
                height: 20,
                fontSize: 11,
              }}
            >
              {format(today, 'd')}
            </div>
            Today
          </div>
        </div>
      </div>

      {/* ── Selected Day Detail ── */}
      {selectedDay && (
        <div className="day-detail-panel">
          <div className="day-detail-title">
            {format(selectedDay, 'EEEE, MMMM d, yyyy')}
          </div>

          {/* Period info */}
          {selectedFlow && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '12px 16px',
              background: 'var(--rose-50)',
              border: '1px solid var(--rose-100)',
              borderRadius: 'var(--radius-md)',
              marginBottom: 12,
            }}>
              <span style={{ fontSize: 20 }}>🩸</span>
              <div>
                <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--rose-600)' }}>
                  Period Day
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 300 }}>
                  Flow: {selectedFlow}
                </div>
              </div>
            </div>
          )}

          {/* Predicted info */}
          {selectedIsPred && !selectedFlow && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '12px 16px',
              background: 'var(--mauve-50)',
              border: '1px solid var(--mauve-100)',
              borderRadius: 'var(--radius-md)',
              marginBottom: 12,
            }}>
              <span style={{ fontSize: 20 }}>🔮</span>
              <div>
                <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--mauve-400)' }}>
                  Predicted Period Day
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 300 }}>
                  Based on your cycle history
                </div>
              </div>
            </div>
          )}

          {/* Log info */}
          {selectedLog ? (
            <div style={{
              padding: '16px',
              background: 'var(--border-light)',
              borderRadius: 'var(--radius-md)',
            }}>
              <div style={{
                fontSize: 13,
                fontWeight: 600,
                color: 'var(--text-secondary)',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                marginBottom: 12,
              }}>
                Symptom Log
              </div>

              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 24 }}>
                  {MOOD_EMOJI[selectedLog.mood] || '😐'}
                </span>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                  <div>
                    <strong>Mood:</strong> {selectedLog.mood}
                  </div>
                  <div>
                    <strong>Energy:</strong> {selectedLog.energyLevel}/10
                  </div>
                  <div>
                    <strong>Sleep:</strong> {selectedLog.sleepHours}h
                  </div>
                  <div>
                    <strong>Water:</strong> {selectedLog.waterIntake} glasses
                  </div>
                </div>
              </div>

              {selectedLog.symptoms?.length > 0 && (
                <div style={{ marginTop: 12 }}>
                  <div style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: 'var(--text-muted)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    marginBottom: 6,
                  }}>
                    Symptoms
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                    {selectedLog.symptoms.map((s) => (
                      <span key={s.name} style={{
                        fontSize: 11,
                        padding: '3px 10px',
                        background: 'var(--rose-50)',
                        border: '1px solid var(--rose-100)',
                        borderRadius: '999px',
                        color: 'var(--rose-600)',
                        textTransform: 'capitalize',
                        fontWeight: 500,
                      }}>
                        {s.name.replace(/_/g, ' ')}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {selectedLog.notes && (
                <div style={{
                  marginTop: 10,
                  fontSize: 13,
                  color: 'var(--text-secondary)',
                  fontStyle: 'italic',
                  fontWeight: 300,
                }}>
                  "{selectedLog.notes}"
                </div>
              )}
            </div>
          ) : (
            <div className="day-detail-empty">
              {!selectedFlow && !selectedIsPred
                ? 'No data for this day'
                : 'No symptom log for this day'}
            </div>
          )}
        </div>
      )}

    </div>
  );
};

export default Calendar;