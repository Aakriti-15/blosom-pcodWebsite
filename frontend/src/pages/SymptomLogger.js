import React, { useState, useEffect, useCallback } from 'react';
import { symptomAPI } from '../utils/api';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import './SymptomLogger.css';

// ── Constants ───────────────────────────────────
const MOOD_OPTIONS = [
  { value: 'great',    emoji: '😊' },
  { value: 'good',     emoji: '🙂' },
  { value: 'okay',     emoji: '😐' },
  { value: 'bad',      emoji: '😔' },
  { value: 'terrible', emoji: '😢' },
];

const EXERCISE_OPTIONS = [
  { value: 'none',     icon: '🛋️', label: 'None'     },
  { value: 'light',    icon: '🚶', label: 'Light'    },
  { value: 'moderate', icon: '🏃', label: 'Moderate' },
  { value: 'intense',  icon: '💪', label: 'Intense'  },
];

const SYMPTOM_CATEGORIES = {
  Physical: [
    'cramps','bloating','headache','fatigue','acne',
    'hair_loss','weight_gain','nausea','back_pain','breast_tenderness',
  ],
  Emotional: [
    'mood_swings','anxiety','depression','irritability','brain_fog',
  ],
  'PCOD Specific': [
    'irregular_period','heavy_bleeding','spotting','pelvic_pain',
    'increased_hair_growth','sleep_issues','food_cravings',
  ],
};

const EMPTY_FORM = {
  date:        format(new Date(), 'yyyy-MM-dd'),
  mood:        'okay',
  energyLevel: 5,
  sleepHours:  7,
  waterIntake: 6,
  exercise:    'none',
  notes:       '',
  symptoms:    [],
};

const MOOD_MAP = {
  great: '😊', good: '🙂', okay: '😐', bad: '😔', terrible: '😢',
};

// ── Slider component ─────────────────────────────
const Slider = ({ min, max, value, onChange, label, unit = '' }) => {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div className="slider-group">
      <div className="slider-header">
        <span className="slider-label">{label}</span>
        <span className="slider-value">{value}{unit}</span>
      </div>
      <input
        type="range"
        className="slider"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ '--pct': `${pct}%` }}
      />
    </div>
  );
};

// ── Main Component ───────────────────────────────
const SymptomLogger = () => {
  const [logs,      setLogs]      = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [submitting,setSubmitting]= useState(false);
  const [form,      setForm]      = useState(EMPTY_FORM);
  const [activeCat, setActiveCat] = useState('Physical');
  const [expanded,  setExpanded]  = useState(null);
  const [showDelete,setShowDelete]= useState(false);
  const [deletingId,setDeletingId]= useState(null);

  // ── Fetch ──
  const fetchLogs = useCallback(async () => {
    try {
      const res = await symptomAPI.getAll({ limit: 30 });
      setLogs(res.data.logs || []);
    } catch {
      toast.error('Failed to load logs');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  // ── Symptom toggle ──
  const toggleSymptom = (name) => {
    const exists = form.symptoms.find((s) => s.name === name);
    if (exists) {
      setForm({
        ...form,
        symptoms: form.symptoms.filter((s) => s.name !== name),
      });
    } else {
      setForm({
        ...form,
        symptoms: [...form.symptoms, { name, severity: 3 }],
      });
    }
  };

  const updateSeverity = (name, severity) => {
    setForm({
      ...form,
      symptoms: form.symptoms.map((s) =>
        s.name === name ? { ...s, severity } : s
      ),
    });
  };

  // ── Open modal ──
  const openAdd = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setActiveCat('Physical');
    setShowModal(true);
  };

  const openEdit = (log) => {
    setForm({
      date:        format(new Date(log.date), 'yyyy-MM-dd'),
      mood:        log.mood        || 'okay',
      energyLevel: log.energyLevel || 5,
      sleepHours:  log.sleepHours  || 7,
      waterIntake: log.waterIntake || 6,
      exercise:    log.exercise    || 'none',
      notes:       log.notes       || '',
      symptoms:    log.symptoms    || [],
    });
    setEditingId(log._id);
    setActiveCat('Physical');
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
  };

  // ── Submit ──
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingId) {
        await symptomAPI.update(editingId, form);
        toast.success('Log updated! 🌸');
      } else {
        await symptomAPI.create(form);
        toast.success('Symptoms logged! 🌸');
      }
      closeModal();
      fetchLogs();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Delete ──
  const confirmDelete = (id) => {
    setDeletingId(id);
    setShowDelete(true);
  };

  const handleDelete = async () => {
    setSubmitting(true);
    try {
      await symptomAPI.delete(deletingId);
      toast.success('Log deleted');
      setShowDelete(false);
      fetchLogs();
    } catch {
      toast.error('Failed to delete');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-center">
        <div className="spinner" />
        <p>Loading your logs...</p>
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
          <h1 className="section-title">Symptom Logger</h1>
          <p className="section-subtitle">
            Track your daily symptoms, mood and wellness
          </p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>
          + Log Today
        </button>
      </div>

      {/* ── Log List ── */}
      {logs.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '60px 24px',
          background: 'white',
          borderRadius: 'var(--radius-lg)',
          border: '1px dashed var(--border)',
        }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📋</div>
          <h3 style={{
            fontFamily: 'Cormorant Garamond, serif',
            fontSize: 24,
            marginBottom: 8,
          }}>
            No logs yet
          </h3>
          <p style={{
            fontSize: 14,
            color: 'var(--text-muted)',
            marginBottom: 24,
            fontWeight: 300,
          }}>
            Start tracking your daily symptoms to discover patterns
            and understand your PCOD health better.
          </p>
          <button className="btn btn-primary" onClick={openAdd}>
            Log Your First Entry
          </button>
        </div>
      ) : (
        logs.map((log) => (
          <div className="log-entry-card" key={log._id}>

            {/* Card header */}
            <div
              className="log-entry-header"
              onClick={() =>
                setExpanded(expanded === log._id ? null : log._id)
              }
            >
              {/* Date box */}
              <div className="log-entry-date-box">
                <div className="log-entry-day">
                  {format(new Date(log.date), 'd')}
                </div>
                <div className="log-entry-month">
                  {format(new Date(log.date), 'MMM')}
                </div>
              </div>

              {/* Mood */}
              <div className="log-entry-mood">
                {MOOD_MAP[log.mood] || '😐'}
              </div>

              {/* Info */}
              <div className="log-entry-info">
                <div className="log-entry-title">
                  {log.mood} day
                </div>
                <div className="log-entry-chips">
                  {log.symptoms?.slice(0, 4).map((s) => (
                    <span className="log-entry-chip" key={s.name}>
                      {s.name.replace(/_/g, ' ')}
                    </span>
                  ))}
                  {log.symptoms?.length > 4 && (
                    <span className="log-entry-chip">
                      +{log.symptoms.length - 4}
                    </span>
                  )}
                </div>
              </div>

              {/* Metrics */}
              <div className="log-entry-metrics">
                <span className="log-metric">⚡ {log.energyLevel}/10</span>
                <span className="log-metric">💤 {log.sleepHours}h</span>
                <span className="log-metric">💧 {log.waterIntake} glasses</span>
              </div>

              {/* Actions */}
              <div
                className="log-entry-actions"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  className="action-btn"
                  onClick={() => openEdit(log)}
                >✏️</button>
                <button
                  className="action-btn action-btn-delete"
                  onClick={() => confirmDelete(log._id)}
                >🗑️</button>
              </div>
            </div>

            {/* Expanded detail */}
            {expanded === log._id && (
              <div className="log-entry-detail">
                <div className="log-detail-item">
                  <div className="log-detail-value">{log.energyLevel}/10</div>
                  <div className="log-detail-label">Energy</div>
                </div>
                <div className="log-detail-item">
                  <div className="log-detail-value">{log.sleepHours}h</div>
                  <div className="log-detail-label">Sleep</div>
                </div>
                <div className="log-detail-item">
                  <div className="log-detail-value">{log.waterIntake}</div>
                  <div className="log-detail-label">Glasses Water</div>
                </div>
                <div className="log-detail-item">
                  <div className="log-detail-value" style={{ textTransform: 'capitalize', fontSize: 16 }}>
                    {log.exercise}
                  </div>
                  <div className="log-detail-label">Exercise</div>
                </div>
                {log.symptoms?.length > 0 && (
                  <div style={{
                    gridColumn: '1 / -1',
                    padding: '12px 14px',
                    background: 'var(--border-light)',
                    borderRadius: 'var(--radius-sm)',
                  }}>
                    <div className="log-detail-label" style={{ marginBottom: 8 }}>
                      All Symptoms
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {log.symptoms.map((s) => (
                        <span key={s.name} style={{
                          fontSize: 12,
                          padding: '3px 10px',
                          background: 'var(--rose-50)',
                          border: '1px solid var(--rose-100)',
                          borderRadius: 'var(--radius-full)',
                          color: 'var(--rose-600)',
                          textTransform: 'capitalize',
                        }}>
                          {s.name.replace(/_/g, ' ')} · {s.severity}/5
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {log.notes && (
                  <div style={{
                    gridColumn: '1 / -1',
                    fontSize: 13,
                    color: 'var(--text-secondary)',
                    fontStyle: 'italic',
                    fontWeight: 300,
                    padding: '8px 14px',
                    background: 'var(--cream)',
                    borderRadius: 'var(--radius-sm)',
                  }}>
                    "{log.notes}"
                  </div>
                )}
              </div>
            )}
          </div>
        ))
      )}

      {/* ══════════════════════════════════════
          LOG SYMPTOM MODAL
      ══════════════════════════════════════ */}
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div
            className="modal-box"
            style={{ maxWidth: 580 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="modal-header">
              <h3 className="modal-title">
                {editingId ? 'Edit Log' : 'Log Symptoms'}
              </h3>
              <button
                className="btn btn-ghost btn-sm"
                onClick={closeModal}
                style={{ fontSize: 20, padding: '4px 10px' }}
              >×</button>
            </div>

            <form onSubmit={handleSubmit}>

              {/* Date */}
              <div className="symptom-modal-section">
                <div className="symptom-modal-section-title">Date</div>
                <input
                  type="date"
                  className="input-field"
                  value={form.date}
                  onChange={(e) =>
                    setForm({ ...form, date: e.target.value })
                  }
                />
              </div>

              {/* Mood */}
              <div className="symptom-modal-section">
                <div className="symptom-modal-section-title">
                  How are you feeling today?
                </div>
                <div className="mood-selector">
                  {MOOD_OPTIONS.map((m) => (
                    <button
                      type="button"
                      key={m.value}
                      className={`mood-option ${form.mood === m.value ? 'selected' : ''}`}
                      onClick={() => setForm({ ...form, mood: m.value })}
                    >
                      <span className="mood-option-emoji">{m.emoji}</span>
                      <span className="mood-option-label">{m.value}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Sliders */}
              <div className="symptom-modal-section">
                <div className="symptom-modal-section-title">
                  Daily Metrics
                </div>
                <Slider
                  label="Energy Level"
                  min={1} max={10}
                  value={form.energyLevel}
                  onChange={(v) => setForm({ ...form, energyLevel: v })}
                  unit="/10"
                />
                <Slider
                  label="Sleep Hours"
                  min={0} max={12}
                  value={form.sleepHours}
                  onChange={(v) => setForm({ ...form, sleepHours: v })}
                  unit="h"
                />
                <Slider
                  label="Water Intake"
                  min={0} max={16}
                  value={form.waterIntake}
                  onChange={(v) => setForm({ ...form, waterIntake: v })}
                  unit=" glasses"
                />
              </div>

              {/* Exercise */}
              <div className="symptom-modal-section">
                <div className="symptom-modal-section-title">Exercise</div>
                <div className="exercise-selector">
                  {EXERCISE_OPTIONS.map((ex) => (
                    <button
                      type="button"
                      key={ex.value}
                      className={`exercise-option ${form.exercise === ex.value ? 'selected' : ''}`}
                      onClick={() =>
                        setForm({ ...form, exercise: ex.value })
                      }
                    >
                      <span className="exercise-option-icon">{ex.icon}</span>
                      {ex.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Symptoms */}
              <div className="symptom-modal-section">
                <div className="symptom-modal-section-title">
                  Symptoms
                  {form.symptoms.length > 0 && (
                    <span style={{
                      marginLeft: 8,
                      color: 'var(--rose-500)',
                      fontWeight: 600,
                    }}>
                      ({form.symptoms.length} selected)
                    </span>
                  )}
                </div>

                {/* Category tabs */}
                <div className="symptom-cat-tabs">
                  {Object.keys(SYMPTOM_CATEGORIES).map((cat) => (
                    <button
                      type="button"
                      key={cat}
                      className={`symptom-cat-tab ${activeCat === cat ? 'active' : ''}`}
                      onClick={() => setActiveCat(cat)}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                {/* Symptom grid */}
                <div className="symptom-grid">
                  {SYMPTOM_CATEGORIES[activeCat].map((s) => {
                    const selected = form.symptoms.some(
                      (fs) => fs.name === s
                    );
                    return (
                      <button
                        type="button"
                        key={s}
                        className={`symptom-btn ${selected ? 'selected' : ''}`}
                        onClick={() => toggleSymptom(s)}
                      >
                        {s.replace(/_/g, ' ')}
                      </button>
                    );
                  })}
                </div>

                {/* Severity sliders */}
                {form.symptoms.length > 0 && (
                  <div className="severity-list">
                    <div className="symptom-modal-section-title">
                      Severity (1 = mild, 5 = severe)
                    </div>
                    {form.symptoms.map((s) => (
                      <div className="severity-item" key={s.name}>
                        <span className="severity-name">
                          {s.name.replace(/_/g, ' ')}
                        </span>
                        <input
                          type="range"
                          className="slider severity-slider"
                          min={1} max={5}
                          value={s.severity}
                          onChange={(e) =>
                            updateSeverity(s.name, Number(e.target.value))
                          }
                          style={{
                            '--pct': `${((s.severity - 1) / 4) * 100}%`,
                          }}
                        />
                        <span className="severity-value">{s.severity}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Notes */}
              <div className="symptom-modal-section">
                <div className="symptom-modal-section-title">
                  Notes (optional)
                </div>
                <textarea
                  className="input-field"
                  rows={3}
                  placeholder="How was your day? Any observations..."
                  value={form.notes}
                  onChange={(e) =>
                    setForm({ ...form, notes: e.target.value })
                  }
                  style={{ resize: 'vertical' }}
                />
              </div>

              {/* Submit */}
              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%', padding: 15 }}
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <span
                      className="spinner"
                      style={{ width: 18, height: 18, borderWidth: 2 }}
                    />
                    Saving...
                  </>
                ) : editingId ? 'Update Log' : 'Save Log 🌸'}
              </button>

            </form>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {showDelete && (
        <div className="modal-overlay" onClick={() => setShowDelete(false)}>
          <div
            className="modal-box"
            style={{ maxWidth: 400 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3 className="modal-title">Delete Log</h3>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => setShowDelete(false)}
                style={{ fontSize: 20, padding: '4px 10px' }}
              >×</button>
            </div>
            <div style={{ textAlign: 'center', padding: '8px 0' }}>
              <div style={{ fontSize: 40, marginBottom: 16 }}>🗑️</div>
              <p style={{
                fontSize: 14,
                color: 'var(--text-secondary)',
                marginBottom: 24,
                lineHeight: 1.6,
              }}>
                Are you sure you want to delete this log?<br />
                This action cannot be undone.
              </p>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                <button
                  className="btn btn-secondary"
                  onClick={() => setShowDelete(false)}
                >Cancel</button>
                <button
                  className="btn btn-primary"
                  onClick={handleDelete}
                  disabled={submitting}
                  style={{
                    background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                    boxShadow: '0 8px 24px rgba(239,68,68,0.25)',
                  }}
                >
                  {submitting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default SymptomLogger;