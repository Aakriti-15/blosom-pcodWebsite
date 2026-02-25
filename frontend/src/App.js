import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import AppLayout from './components/layout/AppLayout';
import Dashboard from './pages/Dashboard';
import CycleTracker from './pages/CycleTracker';
import SymptomLogger   from './pages/SymptomLogger';
import Insights        from './pages/Insights';
import Profile         from './pages/Profile';
import NotFound from './pages/NotFound';


function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3500,
            style: {
              background: 'white',
              color: '#1a1410',
              borderRadius: '14px',
              border: '1px solid #ffe4e6',
              fontSize: '14px',
              fontFamily: 'Jost, sans-serif',
              boxShadow: '0 8px 32px rgba(0,0,0,0.10)',
            },
            success: {
              iconTheme: {
                primary: '#22c55e',
                secondary: 'white',
              },
            },
            error: {
              iconTheme: {
                primary: '#f43f5e',
                secondary: 'white',
              },
            },
          }}
        />

        <Routes>
          {/* Public routes */}
          <Route path="/login"    element={<Login />}    />
          <Route path="/register" element={<Register />} />


           {/* Protected */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >


           <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="cycles"    element={<CycleTracker />}  />
            <Route path="symptoms"  element={<SymptomLogger />} />
            <Route path="insights"  element={<Insights />}       />
            <Route path="profile"   element={<Profile />}        />
          </Route>


          {/* Catch all → redirect to login for now */}
          {/* (we'll add more routes in Day 7 onwards) */}
          <Route path="*" element={<NotFound />} />
        </Routes>

      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;