import React from 'react';
import { useNavigate } from 'react-router-dom';

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--warm-white)',
      fontFamily: 'Jost, sans-serif',
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>🌸</div>
        <h1 style={{
          fontFamily: 'Cormorant Garamond, serif',
          fontSize: 48,
          color: 'var(--text-primary)',
          marginBottom: 8,
        }}>
          404
        </h1>
        <p style={{
          fontSize: 16,
          color: 'var(--text-muted)',
          marginBottom: 32,
          fontWeight: 300,
        }}>
          This page doesn't exist
        </p>
        <button
          className="btn btn-primary"
          onClick={() => navigate('/dashboard')}
        >
          Go to Dashboard
        </button>
      </div>
    </div>
  );
};

export default NotFound;