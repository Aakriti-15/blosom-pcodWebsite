import React, { useState, useEffect, useCallback } from 'react';
import { cycleAPI } from '../utils/api';
import { format, differenceInDays } from 'date-fns';
import toast from 'react-hot-toast';
import './CycleTracker.css';

// ── Constants ───────────────────────────────────
const FLOW_OPTIONS = [
  { value: 'light',    label: 'Light',    dotClass: 'flow-light'    },
  { value: 'moderate', label: 'Moderate', dotClass: 'flow-moderate' },
  { value: 'heavy',    label: 'Heavy',    dotClass: 'flow-heavy'    },
  { value: 'spotting', label: 'Spotting', dotClass: 'flow-spotting' },
];

const EMPTY_FORM = {
  startDate:     '',
  endDate:       '',
  flowIntensity: 'moderate',
  notes:         '',
};

// ── Helper ──────────────────────────────────────
const formatDate = (d) =>
  d ? format(new Date(d), 'MMM d, yyyy') : '—';

const toInputDate = (d) =>
  d ? format(new Date(d), 'yyyy-MM-dd') : '';

// ── Component ───────────────────────────────────
const CycleTracker = () => {
  const [cycles,     setCycles]     = useState([]);
  const [prediction, setPrediction] = useState(null);
  const [stats,      setStats]      = useState(null);
  const [loading,    setLoading]    = useState(true);

  // Modal states
  const [showModal,   setShowModal]   = useState(false);
  const [showDelete,  setShowDelete]  = useState(false);
  const [editingId,   setEditingId]   = useState(null);
  const [deletingId,  setDeletingId]  = useState(null);
  const [submitting,  setSubmitting]  = useState(false);
  const [form,        setForm]        = useState(EMPTY_FORM);

  // ── Fetch ──
  const fetchData = useCallback(async () => {
    try {
      const [cycleRes, statsRes] = await Promise.all([
        cycleAPI.getAll({ limit: 20 }),
        cycleAPI.getStats(),
      ]);
      setCycles(cycleRes.data.cycles || []);
      setPrediction(cycleRes.data.prediction);
      setStats(statsRes.data.stats);
    } catch {
      toast.error('Failed to load cycle data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Open modal ──
  const openAdd = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setShowModal(true);
  };

  const openEdit = (cycle) => {
    setForm({
      startDate:     toInputDate(cycle.startDate),
      endDate:       toInputDate(cycle.endDate),
      flowIntensity: cycle.flowIntensity || 'moderate',
      notes:         cycle.notes || '',
    });
    setEditingId(cycle._id);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
  };

  // ── Submit ──
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.startDate) {
      toast.error('Please select a start date');
      return;
    }
    setSubmitting(true);
    try {
      if (editingId) {
        await cycleAPI.update(editingId, form);
        toast.success('Cycle updated! 🌙');
      } else {
        await cycleAPI.create(form);
        toast.success('Cycle logged! 🌸');
      }
      closeModal();
      fetchData();
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
      await cycleAPI.delete(deletingId);
      toast.success('Cycle deleted');
      setShowDelete(false);
      setDeletingId(null);
      fetchData();
    } catch {
      toast.error('Failed to delete');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Prediction display ──
  const daysUntil = prediction
    ? differenceInDays(new Date(prediction.predictedStartDate), new Date())
    : null;

  if (loading) {
    return (
      <div className="loading-center">
        <div className="spinner" />
        <p>Loading cycles...</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">

      {/* ── Header ── */}
      <div className="cycle-header">
        <div>
          <h1 className="section-title">Cycle Tracker</h1>
          <p className="section-subtitle">
            Track your periods and predict your next cycle
          </p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>
          + Log New Cycle
        </button>
      </div>

      {/* ── Prediction Card ── */}
      <div className="cycle-prediction-card" style={{ marginBottom: 24 }}>
        <div className="cycle-pred-content">
          <div>
            <div className="cycle-pred-label">Next Period Predicted</div>
            <div className="cycle-pred-value">
              {prediction
                ? daysUntil === 0
                  ? 'Expected Today!'
                  : daysUntil < 0
                  ? 'May Have Started'
                  : `In ${daysUntil} Day${daysUntil !== 1 ? 's' : ''}`
                : 'Log cycles to unlock prediction'}
            </div>
            <div className="cycle-pred-date">
              {prediction
                ? formatDate(prediction.predictedStartDate)
                : 'Need at least 1 cycle logged'}
            </div>
          </div>
          {prediction && (
            <div className="cycle-pred-badge">
              {prediction.confidence === 'high'   ? '✦ High Confidence'   :
               prediction.confidence === 'medium' ? '◈ Medium Confidence' :
                                                    '◇ Low Confidence'}
            </div>
          )}
        </div>
      </div>

      {/* ── Stats Row ── */}
      <div className="cycle-stats-row">
        {[
          {
            icon: '📅',
            iconBg: 'stat-icon-rose',
            value: stats?.averageCycleLength
              ? `${stats.averageCycleLength}d`
              : '—',
            label: 'Avg Cycle Length',
            sub: stats?.averageCycleLength
              ? stats.averageCycleLength >= 21 && stats.averageCycleLength <= 35
                ? '✓ Normal range'
                : '⚠ Outside normal'
              : 'No data yet',
          },
          {
            icon: '🌸',
            iconBg: 'stat-icon-mauve',
            value: stats?.averagePeriodLength
              ? `${stats.averagePeriodLength}d`
              : '—',
            label: 'Avg Period Length',
            sub: `Shortest: ${stats?.shortestCycle || '—'}d`,
          },
          {
            icon: '⚠️',
            iconBg: 'stat-icon-gold',
            value: stats?.irregularCycles || 0,
            label: 'Irregular Cycles',
            sub: `Out of ${stats?.totalCyclesLogged || 0} total`,
          },
        ].map((s, i) => (
          <div className="stat-card" key={i}>
            <div className={`stat-icon ${s.iconBg}`}>{s.icon}</div>
            <div>
              <div className="stat-value">{s.value}</div>
              <div className="stat-label">{s.label}</div>
              {s.sub && (
                <div style={{
                  fontSize: 11,
                  color: 'var(--text-muted)',
                  marginTop: 3,
                  fontWeight: 300,
                }}>
                  {s.sub}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* ── Cycle History ── */}
      <div className="cycle-list-header">
        <h2 className="cycle-list-title">
          Cycle History
          {cycles.length > 0 && (
            <span style={{
              fontSize: 14,
              fontWeight: 400,
              color: 'var(--text-muted)',
              marginLeft: 10,
              fontFamily: 'Jost, sans-serif',
            }}>
              ({cycles.length} cycles)
            </span>
          )}
        </h2>
      </div>

      {cycles.length === 0 ? (
        <div className="cycle-empty">
          <div className="cycle-empty-icon">🌙</div>
          <h3>No cycles logged yet</h3>
          <p>
            Start tracking your period to unlock cycle predictions,<br />
            pattern analysis, and personalized insights.
          </p>
          <button className="btn btn-primary" onClick={openAdd}>
            Log Your First Cycle
          </button>
        </div>
      ) : (
        cycles.map((cycle, idx) => {
          const isIrregular =
            cycle.cycleLength &&
            (cycle.cycleLength < 21 || cycle.cycleLength > 35);

          return (
            <div className="cycle-item" key={cycle._id}>

              {/* Flow dot */}
              <div
                className={`flow-dot flow-${cycle.flowIntensity || 'moderate'}`}
              />

              {/* Dates */}
              <div className="cycle-item-dates">
                <div className="cycle-item-start">
                  {formatDate(cycle.startDate)}
                </div>
                <div className="cycle-item-end">
                  {cycle.endDate
                    ? `Ended ${formatDate(cycle.endDate)}`
                    : 'End date not set'}
                  {cycle.notes && ` · ${cycle.notes}`}
                </div>
              </div>

              {/* Badges */}
              <div className="cycle-item-badges">
                {cycle.cycleLength && (
                  <span className="cycle-length-badge">
                    {cycle.cycleLength}d cycle
                  </span>
                )}
                {cycle.periodLength && (
                  <span className="period-length-badge">
                    {cycle.periodLength}d period
                  </span>
                )}
                {isIrregular && (
                  <span className="irregular-badge">Irregular</span>
                )}
                {idx === 0 && (
                  <span className="badge badge-sage">Latest</span>
                )}
              </div>

              {/* Actions */}
              <div className="cycle-item-actions">
                <button
                  className="action-btn"
                  onClick={() => openEdit(cycle)}
                  title="Edit"
                >
                  ✏️
                </button>
                <button
                  className="action-btn action-btn-delete"
                  onClick={() => confirmDelete(cycle._id)}
                  title="Delete"
                >
                  🗑️
                </button>
              </div>
            </div>
          );
        })
      )}

      {/* ═══════════════════════════════════════
          LOG / EDIT CYCLE MODAL
      ═══════════════════════════════════════ */}
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div
            className="modal-box"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="modal-header">
              <h3 className="modal-title">
                {editingId ? 'Edit Cycle' : 'Log New Cycle'}
              </h3>
              <button
                className="btn btn-ghost btn-sm"
                onClick={closeModal}
                style={{ fontSize: 20, padding: '4px 10px' }}
              >
                ×
              </button>
            </div>

            {/* Body */}
            <form onSubmit={handleSubmit} className="cycle-modal-body">

              {/* Start Date */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="label">Period Start Date *</label>
                <input
                  type="date"
                  className="input-field"
                  value={form.startDate}
                  onChange={(e) =>
                    setForm({ ...form, startDate: e.target.value })
                  }
                  required
                />
              </div>

              {/* End Date */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="label">
                  Period End Date
                  <span style={{
                    color: 'var(--text-muted)',
                    fontWeight: 300,
                    marginLeft: 6,
                    textTransform: 'none',
                    letterSpacing: 0,
                  }}>
                    (optional)
                  </span>
                </label>
                <input
                  type="date"
                  className="input-field"
                  value={form.endDate}
                  min={form.startDate}
                  onChange={(e) =>
                    setForm({ ...form, endDate: e.target.value })
                  }
                />
              </div>

              {/* Flow Intensity */}
              <div>
                <label className="label">Flow Intensity</label>
                <div className="flow-selector">
                  {FLOW_OPTIONS.map((opt) => (
                    <button
                      type="button"
                      key={opt.value}
                      className={`flow-option ${form.flowIntensity === opt.value ? 'selected' : ''}`}
                      onClick={() =>
                        setForm({ ...form, flowIntensity: opt.value })
                      }
                    >
                      <div
                        className={`flow-option-dot ${opt.dotClass}`}
                        style={{
                          background:
                            opt.value === 'light'    ? '#fda4af' :
                            opt.value === 'moderate' ? '#fb7185' :
                            opt.value === 'heavy'    ? '#e11d48' :
                                                       '#c4b5fd',
                        }}
                      />
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="label">Notes (optional)</label>
                <textarea
                  className="input-field"
                  rows={3}
                  placeholder="Any notes about this cycle..."
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
                style={{ width: '100%', padding: '14px' }}
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
                ) : editingId ? 'Update Cycle' : 'Log Cycle 🌙'}
              </button>

            </form>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════
          DELETE CONFIRMATION MODAL
      ═══════════════════════════════════════ */}
      {showDelete && (
        <div className="modal-overlay" onClick={() => setShowDelete(false)}>
          <div
            className="modal-box"
            style={{ maxWidth: 400 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3 className="modal-title">Delete Cycle</h3>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => setShowDelete(false)}
                style={{ fontSize: 20, padding: '4px 10px' }}
              >
                ×
              </button>
            </div>

            <div className="delete-confirm">
              <div style={{ fontSize: 40, marginBottom: 16 }}>🗑️</div>
              <p>
                Are you sure you want to delete this cycle?<br />
                This action cannot be undone and may affect<br />
                your cycle predictions.
              </p>
              <div className="delete-confirm-actions">
                <button
                  className="btn btn-secondary"
                  onClick={() => setShowDelete(false)}
                >
                  Cancel
                </button>
                <button
                  className="btn btn-primary"
                  onClick={handleDelete}
                  disabled={submitting}
                  style={{
                    background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                    boxShadow: '0 8px 24px rgba(239,68,68,0.25)',
                  }}
                >
                  {submitting ? 'Deleting...' : 'Yes, Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default CycleTracker;