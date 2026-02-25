import React from 'react';
import { Link } from 'react-router-dom';

const Register = () => {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'Jost, sans-serif',
      background: '#fffcf9',
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🌸</div>
        <h1 style={{
          fontFamily: 'Cormorant Garamond, serif',
          fontSize: 36,
          marginBottom: 8,
        }}>
          Blósom
        </h1>
        <p style={{ color: '#a8998a', marginBottom: 24 }}>
          Register page — coming Day 7!
        </p>
        <Link to="/login" style={{
          background: '#f43f5e',
          color: 'white',
          padding: '12px 28px',
          borderRadius: '999px',
          fontSize: 14,
        }}>
          ← Back to Login
        </Link>
      </div>
    </div>
  );
};

export default Register;