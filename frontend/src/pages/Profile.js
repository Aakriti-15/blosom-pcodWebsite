import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../utils/api';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import './Profile.css';

const Profile = () => {
  const { user, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState('personal');
  const [saving,    setSaving]    = useState(false);

  // ── Personal form ──
  const [personal, setPersonal] = useState({
    name:        user?.name        || '',
    dateOfBirth: user?.dateOfBirth
      ? format(new Date(user.dateOfBirth), 'yyyy-MM-dd')
      : '',
  });

  // ── Health profile form ──
  const hp = user?.healthProfile || {};
  const [health, setHealth] = useState({
    diagnosedWithPCOD:    hp.diagnosedWithPCOD    || false,
    averageCycleLength:   hp.averageCycleLength   || 28,
    averagePeriodLength:  hp.averagePeriodLength  || 5,
    weight:               hp.weight               || '',
    height:               hp.height               || '',
    medications:          hp.medications?.join(', ') || '',
  });

  // ── Password form ──
  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword:     '',
    confirmPassword: '',
  });

  const [pwErrors, setPwErrors] = useState({});

  // ── Save personal ──
  const savePersonal = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await authAPI.updateProfile(personal);
      updateUser(res.data.user);
      toast.success('Profile updated! 🌸');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update');
    } finally {
      setSaving(false);
    }
  };

  // ── Save health ──
  const saveHealth = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await authAPI.updateProfile({
        healthProfile: {
          ...health,
          medications: health.medications
            .split(',')
            .map((m) => m.trim())
            .filter(Boolean),
        },
      });
      updateUser(res.data.user);
      toast.success('Health profile updated! 🌸');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update');
    } finally {
      setSaving(false);
    }
  };

  // ── Save password ──
  const savePassword = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!passwords.currentPassword)
      errs.currentPassword = 'Required';
    if (!passwords.newPassword || passwords.newPassword.length < 6)
      errs.newPassword = 'Min 6 characters';
    if (passwords.newPassword !== passwords.confirmPassword)
      errs.confirmPassword = 'Passwords do not match';
    if (Object.keys(errs).length) return setPwErrors(errs);

    setSaving(true);
    try {
      await authAPI.changePassword({
        currentPassword: passwords.currentPassword,
        newPassword:     passwords.newPassword,
      });
      toast.success('Password changed! 🔒');
      setPasswords({
        currentPassword: '',
        newPassword:     '',
        confirmPassword: '',
      });
      setPwErrors({});
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    } finally {
      setSaving(false);
    }
  };

  // ── Get initials ──
  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  return (
    <div className="animate-fade-in">

      {/* ── Profile Header Card ── */}
      <div className="profile-header-card">
        <div className="profile-avatar-large">{initials}</div>
        <div className="profile-header-info">
          <div className="profile-header-name">{user?.name}</div>
          <div className="profile-header-email">{user?.email}</div>
          <div className="profile-header-badge">
            🌸 Member since{' '}
            {user?.createdAt
              ? format(new Date(user.createdAt), 'MMMM yyyy')
              : 'recently'}
          </div>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="tabs" style={{ marginBottom: 24 }}>
        {[
          { key: 'personal', label: 'Personal Info' },
          { key: 'health',   label: 'Health Profile' },
          { key: 'security', label: 'Security' },
        ].map((t) => (
          <button
            key={t.key}
            className={`tab-btn ${activeTab === t.key ? 'tab-btn-active' : ''}`}
            onClick={() => setActiveTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ══ Personal Info Tab ══ */}
      {activeTab === 'personal' && (
        <div className="profile-form-card animate-fade-in">
          <h2 style={{
            fontFamily: 'Cormorant Garamond, serif',
            fontSize: 22,
            marginBottom: 24,
          }}>
            Personal Information
          </h2>

          <form onSubmit={savePersonal}>
            <div className="grid-2">
              <div className="form-group">
                <label className="label">Full Name</label>
                <input
                  type="text"
                  className="input-field"
                  value={personal.name}
                  onChange={(e) =>
                    setPersonal({ ...personal, name: e.target.value })
                  }
                />
              </div>
              <div className="form-group">
                <label className="label">Email Address</label>
                <input
                  type="email"
                  className="input-field"
                  value={user?.email || ''}
                  disabled
                  style={{ opacity: 0.6, cursor: 'not-allowed' }}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="label">Date of Birth</label>
              <input
                type="date"
                className="input-field"
                value={personal.dateOfBirth}
                onChange={(e) =>
                  setPersonal({ ...personal, dateOfBirth: e.target.value })
                }
              />
            </div>

            <div className="profile-save-btn">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ══ Health Profile Tab ══ */}
      {activeTab === 'health' && (
        <div className="profile-form-card animate-fade-in">
          <h2 style={{
            fontFamily: 'Cormorant Garamond, serif',
            fontSize: 22,
            marginBottom: 24,
          }}>
            Health Profile
          </h2>

          <form onSubmit={saveHealth}>

            {/* PCOD Toggle */}
            <div
              className="pcod-toggle"
              onClick={() =>
                setHealth({
                  ...health,
                  diagnosedWithPCOD: !health.diagnosedWithPCOD,
                })
              }
            >
              <div>
                <div className="pcod-toggle-label">
                  Diagnosed with PCOD/PCOS
                </div>
                <div className="pcod-toggle-sub">
                  Helps personalize your insights and tips
                </div>
              </div>
              <div
                className={`toggle-switch ${health.diagnosedWithPCOD ? 'on' : ''}`}
              />
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label className="label">Avg Cycle Length (days)</label>
                <input
                  type="number"
                  className="input-field"
                  value={health.averageCycleLength}
                  min={15} max={60}
                  onChange={(e) =>
                    setHealth({
                      ...health,
                      averageCycleLength: Number(e.target.value),
                    })
                  }
                />
              </div>
              <div className="form-group">
                <label className="label">Avg Period Length (days)</label>
                <input
                  type="number"
                  className="input-field"
                  value={health.averagePeriodLength}
                  min={1} max={15}
                  onChange={(e) =>
                    setHealth({
                      ...health,
                      averagePeriodLength: Number(e.target.value),
                    })
                  }
                />
              </div>
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label className="label">Weight (kg)</label>
                <input
                  type="number"
                  className="input-field"
                  placeholder="e.g. 60"
                  value={health.weight}
                  onChange={(e) =>
                    setHealth({ ...health, weight: e.target.value })
                  }
                />
              </div>
              <div className="form-group">
                <label className="label">Height (cm)</label>
                <input
                  type="number"
                  className="input-field"
                  placeholder="e.g. 165"
                  value={health.height}
                  onChange={(e) =>
                    setHealth({ ...health, height: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="form-group">
              <label className="label">
                Current Medications
                <span style={{
                  color: 'var(--text-muted)',
                  fontWeight: 300,
                  marginLeft: 6,
                  textTransform: 'none',
                  letterSpacing: 0,
                }}>
                  (comma separated)
                </span>
              </label>
              <input
                type="text"
                className="input-field"
                placeholder="e.g. Metformin, Inositol, Vitamin D"
                value={health.medications}
                onChange={(e) =>
                  setHealth({ ...health, medications: e.target.value })
                }
              />
            </div>

            <div className="profile-save-btn">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save Health Profile'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ══ Security Tab ══ */}
      {activeTab === 'security' && (
        <div className="profile-form-card animate-fade-in">
          <h2 style={{
            fontFamily: 'Cormorant Garamond, serif',
            fontSize: 22,
            marginBottom: 24,
          }}>
            Change Password
          </h2>

          <form onSubmit={savePassword}>
            <div className="form-group">
              <label className="label">Current Password</label>
              <input
                type="password"
                className={`input-field ${pwErrors.currentPassword ? 'input-error' : ''}`}
                placeholder="Enter current password"
                value={passwords.currentPassword}
                onChange={(e) => {
                  setPasswords({
                    ...passwords,
                    currentPassword: e.target.value,
                  });
                  setPwErrors({ ...pwErrors, currentPassword: '' });
                }}
              />
              {pwErrors.currentPassword && (
                <p className="error-text">⚠ {pwErrors.currentPassword}</p>
              )}
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label className="label">New Password</label>
                <input
                  type="password"
                  className={`input-field ${pwErrors.newPassword ? 'input-error' : ''}`}
                  placeholder="Min. 6 characters"
                  value={passwords.newPassword}
                  onChange={(e) => {
                    setPasswords({
                      ...passwords,
                      newPassword: e.target.value,
                    });
                    setPwErrors({ ...pwErrors, newPassword: '' });
                  }}
                />
                {pwErrors.newPassword && (
                  <p className="error-text">⚠ {pwErrors.newPassword}</p>
                )}
              </div>

              <div className="form-group">
                <label className="label">Confirm New Password</label>
                <input
                  type="password"
                  className={`input-field ${pwErrors.confirmPassword ? 'input-error' : ''}`}
                  placeholder="Repeat new password"
                  value={passwords.confirmPassword}
                  onChange={(e) => {
                    setPasswords({
                      ...passwords,
                      confirmPassword: e.target.value,
                    });
                    setPwErrors({ ...pwErrors, confirmPassword: '' });
                  }}
                />
                {pwErrors.confirmPassword && (
                  <p className="error-text">⚠ {pwErrors.confirmPassword}</p>
                )}
              </div>
            </div>

            <div className="profile-save-btn">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={saving}
              >
                {saving ? 'Changing...' : 'Change Password 🔒'}
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
};

export default Profile;