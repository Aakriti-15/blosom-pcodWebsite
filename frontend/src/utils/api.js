import axios from 'axios';

const API = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

// Attach token to every request automatically
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle expired token globally
API.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// ── Auth ──────────────────────────────────────
export const authAPI = {
  register:       (data) => API.post('/auth/register', data),
  login:          (data) => API.post('/auth/login', data),
  getMe:          ()     => API.get('/auth/me'),
  updateProfile:  (data) => API.put('/auth/profile', data),
  changePassword: (data) => API.put('/auth/change-password', data),
};

// ── Cycles ────────────────────────────────────
export const cycleAPI = {
  getAll:   (params) => API.get('/cycles', { params }),
  getStats: ()       => API.get('/cycles/stats'),
  create:   (data)   => API.post('/cycles', data),
  update:   (id, data) => API.put(`/cycles/${id}`, data),
  delete:   (id)     => API.delete(`/cycles/${id}`),
};

// ── Symptoms ──────────────────────────────────
export const symptomAPI = {
  getAll:   (params)   => API.get('/symptoms', { params }),
  getById:  (id)       => API.get(`/symptoms/${id}`),
  getStats: (params)   => API.get('/symptoms/stats', { params }),
  create:   (data)     => API.post('/symptoms', data),
  update:   (id, data) => API.put(`/symptoms/${id}`, data),
  delete:   (id)       => API.delete(`/symptoms/${id}`),
};

export default API;