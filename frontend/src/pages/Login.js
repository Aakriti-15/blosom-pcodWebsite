import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import './Auth.css';

const FEATURES = [
  { icon: '🌙', label: 'Smart cycle prediction using your data' },
  { icon: '📊', label: 'Symptom patterns & insights over time'  },
  { icon: '🩺', label: 'PCOD-specific health tracking tools'    },
  { icon: '🔒', label: 'Private, secure & only yours'           },
];

const Login = () => {
  const { login } = useAuth();
  const navigate   = useNavigate();

  const [form, setForm]     = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors]   = useState({});

  const validate = () => {
    const e = {};
    if (!form.email)    e.email    = 'Email is required';
    if (!form.password) e.password = 'Password is required';
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
      await login(form);
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
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

          {/* Brand */}
          <div className="auth-brand-mark">
            <div className="auth-brand-icon">🌸</div>
            <span className="auth-brand-text">Blósom</span>
          </div>

          {/* Heading */}
          <h1 className="auth-hero-heading">
            Your body,<br />
            <em>understood.</em>
          </h1>

          <p className="auth-hero-desc">
            A wellness companion built for women with PCOD.
            Track cycles, decode symptoms, and finally
            understand your patterns.
          </p>

          {/* Features */}
          <div className="auth-features">
            {FEATURES.map((f, i) => (
              <div className="auth-feature-item" key={i}>
                <div className="feature-icon-wrap">{f.icon}</div>
                <span className="feature-label">{f.label}</span>
              </div>
            ))}
          </div>

          {/* Stats */}
          <div className="auth-stats">
            {[
              { value: '28d',  label: 'Avg Cycle'  },
              { value: '22+',  label: 'Symptoms'   },
              { value: '100%', label: 'Private'     },
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

          {/* Badge */}
          <div className="auth-top-badge">
            <div className="auth-badge-dot" />
            Wellness Platform
          </div>

          {/* Title */}
          <h2 className="auth-form-title">
            Welcome<br />back
          </h2>
          <p className="auth-form-subtitle">
            Sign in to continue your wellness journey
          </p>

          {/* Form */}
          <form onSubmit={handleSubmit}>

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

            <div className="auth-input-group">
              <label className="auth-label">Password</label>
              <input
                type="password"
                className={`auth-input ${errors.password ? 'auth-input-error' : ''}`}
                placeholder="Enter your password"
                value={form.password}
                onChange={handleChange('password')}
              />
              {errors.password && (
                <p className="auth-error-msg">⚠ {errors.password}</p>
              )}
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
                  Signing in...
                </>
              ) : 'Sign In →'}
            </button>

          </form>

          <p className="auth-switch">
            New to Blósom?{' '}
            <Link to="/register">Create your account</Link>
          </p>

          <div className="auth-privacy">
            🔒 Your health data is private and encrypted
          </div>

        </div>
      </div>

    </div>
  );
};

export default Login;