import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { authAPI } from '../utils/api';
import toast from 'react-hot-toast';

const AuthContext = createContext();

const initialState = {
  user:            null,
  token:           localStorage.getItem('token'),
  loading:         true,
  isAuthenticated: false,
};

const authReducer = (state, action) => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };

    case 'LOGIN_SUCCESS':
      localStorage.setItem('token', action.payload.token);
      return {
        ...state,
        user:            action.payload.user,
        token:           action.payload.token,
        isAuthenticated: true,
        loading:         false,
      };

    case 'LOGOUT':
      localStorage.removeItem('token');
      return {
        ...state,
        user:            null,
        token:           null,
        isAuthenticated: false,
        loading:         false,
      };

    case 'UPDATE_USER':
      return { ...state, user: action.payload };

    default:
      return state;
  }
};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Auto login if token exists in localStorage
  useEffect(() => {
    const loadUser = async () => {
      if (state.token) {
        try {
          const res = await authAPI.getMe();
          dispatch({
            type: 'LOGIN_SUCCESS',
            payload: { user: res.data.user, token: state.token },
          });
        } catch {
          dispatch({ type: 'LOGOUT' });
        }
      } else {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };
    loadUser();
    // eslint-disable-next-line
  }, []);

  const login = async (credentials) => {
    const res = await authAPI.login(credentials);
    dispatch({ type: 'LOGIN_SUCCESS', payload: res.data });
    toast.success(`Welcome back, ${res.data.user.name}! 🌸`);
    return res.data;
  };

  const register = async (data) => {
    const res = await authAPI.register(data);
    dispatch({ type: 'LOGIN_SUCCESS', payload: res.data });
    toast.success(`Welcome to Blósom, ${res.data.user.name}! 🌸`);
    return res.data;
  };

  const logout = () => {
    dispatch({ type: 'LOGOUT' });
    toast.success('Logged out successfully');
  };

  const updateUser = (user) => {
    dispatch({ type: 'UPDATE_USER', payload: user });
  };

  return (
    <AuthContext.Provider
      value={{ ...state, login, register, logout, updateUser }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};