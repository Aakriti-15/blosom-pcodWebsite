import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import './Auth.css';

const FEATURES = [
  { icon: '✨', label: 'Personalized cycle predictions from day one' },
  { icon: '📋', label: 'Log 22 PCOD-specific symptoms daily'        },
  { icon: '📈', label: 'See your health trends over months'          },
  { icon: '💊', label: 'Track medications and health profile'        },
];

const Register = () => {
  const { register } = useAuth();
  const navigate      = useNavigate();

  const [form, setForm] = useState({
    name:            '',
    email:           '',
    password:        '',
    confirmPassword: '',
    dateOfBirth:     '',
  });
  const [loading, setLoading] = useState(false);
  const [errors,  setErrors]  = useState({});

  const validate = () => {
    const e = {};
    if (!form.name.trim())
      e.name = 'Name is required';
    if (!form.email)
      e.email = 'Email is required';
    if (!form.password || form.password.length < 6)
      e.password = 'Password must be at least 6 characters';
    if (form.password !== form.confirmPassword)
      e.confirmPassword = 'Passwords do not match';
    return e;
  };

  const handleChange = (field) => (ev) => {
    setForm({ ...form, [field]: ev.target.value });
    setErrors({ ...errors, [field]: '' });
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    const e = validate();
    if (Object.keys(e).length) return setErrors(e);
    setLoading(true);
    try {
      const { confirmPassword, ...submitData } = form;
      await register(submitData);
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">

      {/* ════ LEFT PANEL ════ */}
      <div className="auth-left">
        <div className="auth-orbs">
          <div className="orb orb-1" />
          <div className="orb orb-2" />
          <div className="orb orb-3" />
        </div>
        <div className="auth-grid-overlay" />

        <div className="auth-left-content">

          <div className="auth-brand-mark">
            <div className="auth-brand-icon">🌸</div>
            <span className="auth-brand-text">Blósom</span>
          </div>

          <h1 className="auth-hero-heading">
            Begin your<br />
            <em>healing journey.</em>
          </h1>

          <p className="auth-hero-desc">
            Join women who've taken control of their PCOD
            health. Track, understand, and thrive with
            data that actually means something.
          </p>

          <div className="auth-features">
            {FEATURES.map((f, i) => (
              <div className="auth-feature-item" key={i}>
                <div className="feature-icon-wrap">{f.icon}</div>
                <span className="feature-label">{f.label}</span>
              </div>
            ))}
          </div>

          <div className="auth-stats">
            {[
              { value: 'Free', label: 'Forever'  },
              { value: '2min', label: 'Setup'     },
              { value: '∞',    label: 'Tracking'  },
            ].map((s) => (
              <div key={s.label}>
                <div className="auth-stat-value">{s.value}</div>
                <div className="auth-stat-label">{s.label}</div>
              </div>
            ))}
          </div>

        </div>
      </div>

      {/* ════ RIGHT PANEL ════ */}
      <div className="auth-right">
        <div className="auth-form-container animate-fade-in">

          <div className="auth-top-badge">
            <div className="auth-badge-dot" />
            Create free account
          </div>

          <h2 className="auth-form-title">
            Join<br />Blósom
          </h2>
          <p className="auth-form-subtitle">
            Your wellness journey starts here
          </p>

          <form onSubmit={handleSubmit}>

            {/* Name */}
            <div className="auth-input-group">
              <label className="auth-label">Full Name</label>
              <input
                type="text"
                className={`auth-input ${errors.name ? 'auth-input-error' : ''}`}
                placeholder="Your name"
                value={form.name}
                onChange={handleChange('name')}
              />
              {errors.name && (
                <p className="auth-error-msg">⚠ {errors.name}</p>
              )}
            </div>

            {/* Email */}
            <div className="auth-input-group">
              <label className="auth-label">Email Address</label>
              <input
                type="email"
                className={`auth-input ${errors.email ? 'auth-input-error' : ''}`}
                placeholder="you@example.com"
                value={form.email}
                onChange={handleChange('email')}
              />
              {errors.email && (
                <p className="auth-error-msg">⚠ {errors.email}</p>
              )}
            </div>

            {/* Date of Birth */}
            <div className="auth-input-group">
              <label className="auth-label">
                Date of Birth
                <span style={{
                  color: 'var(--text-muted)',
                  fontWeight: 300,
                  marginLeft: 6,
                  textTransform: 'none',
                  letterSpacing: 0,
                  fontSize: 11,
                }}>
                  (optional)
                </span>
              </label>
              <input
                type="date"
                className="auth-input"
                value={form.dateOfBirth}
                onChange={handleChange('dateOfBirth')}
              />
            </div>

            {/* Password row */}
            <div className="auth-input-row">
              <div className="auth-input-group">
                <label className="auth-label">Password</label>
                <input
                  type="password"
                  className={`auth-input ${errors.password ? 'auth-input-error' : ''}`}
                  placeholder="Min. 6 chars"
                  value={form.password}
                  onChange={handleChange('password')}
                />
                {errors.password && (
                  <p className="auth-error-msg">⚠ {errors.password}</p>
                )}
              </div>

              <div className="auth-input-group">
                <label className="auth-label">Confirm</label>
                <input
                  type="password"
                  className={`auth-input ${errors.confirmPassword ? 'auth-input-error' : ''}`}
                  placeholder="Repeat it"
                  value={form.confirmPassword}
                  onChange={handleChange('confirmPassword')}
                />
                {errors.confirmPassword && (
                  <p className="auth-error-msg">⚠ {errors.confirmPassword}</p>
                )}
              </div>
            </div>

            <button
              type="submit"
              className="auth-submit-btn"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span
                    className="spinner"
                    style={{ width: 18, height: 18, borderWidth: 2 }}
                  />
                  Creating account...
                </>
              ) : 'Create My Account →'}
            </button>

          </form>

          <p className="auth-switch">
            Already have an account?{' '}
            <Link to="/login">Sign in</Link>
          </p>

          <div className="auth-privacy">
            🔒 Your health data is private and encrypted
          </div>

        </div>
      </div>

    </div>
  );
};

export default Register;