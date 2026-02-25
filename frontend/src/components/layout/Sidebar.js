import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Sidebar.css';

const NAV_ITEMS = [
  { path: '/dashboard', icon: '🏠', label: 'Dashboard'      },
  { path: '/cycles',    icon: '🌙', label: 'Cycle Tracker'  },
  { path: '/symptoms',  icon: '📋', label: 'Symptom Logger' },
  { path: '/insights',  icon: '📊', label: 'Insights'       },
  { path: '/profile',   icon: '👤', label: 'Profile'        },
];

const Sidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Get initials from name
  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  return (
    <>
      {/* Mobile hamburger */}
      <button
        className="sidebar-hamburger"
        onClick={() => setOpen(true)}
      >
        ☰
      </button>

      {/* Mobile overlay */}
      <div
        className={`sidebar-overlay ${open ? 'open' : ''}`}
        onClick={() => setOpen(false)}
      />

      {/* Sidebar */}
      <aside className={`sidebar ${open ? 'open' : ''}`}>

        {/* Brand */}
        <div className="sidebar-brand">
          <div className="sidebar-brand-icon">🌸</div>
          <div>
            <div className="sidebar-brand-name">Blósom</div>
            <div className="sidebar-brand-tagline">Wellness Platform</div>
          </div>
        </div>

        {/* User card */}
        <div className="sidebar-user">
          <div className="sidebar-avatar">{initials}</div>
          <div>
            <div className="sidebar-user-name">
              {user?.name || 'User'}
            </div>
            <div className="sidebar-user-status">
              ✦ Wellness Journey
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          <div className="sidebar-nav-label">Main Menu</div>

          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `sidebar-nav-item ${isActive ? 'active' : ''}`
              }
              onClick={() => setOpen(false)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-text">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Bottom */}
        <div className="sidebar-bottom">
          <button
            className="sidebar-logout-btn"
            onClick={handleLogout}
          >
            <span className="nav-icon">🚪</span>
            <span>Sign Out</span>
          </button>
        </div>

      </aside>
    </>
  );
};

export default Sidebar;