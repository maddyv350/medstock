import axios from 'axios';

// In dev, Vite proxies /api to the backend. In production set VITE_API_URL.
const baseURL = import.meta.env.VITE_API_URL || '/api';

// Generous timeout: the free Render backend sleeps when idle and the first
// request after a cold start can take ~30-50s to wake it.
const api = axios.create({ baseURL, timeout: 60000 });

// Attach the stored JWT to every request.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('medstock_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// On 401, clear the session and bounce to login.
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && !err.config.url.includes('/auth/login')) {
      localStorage.removeItem('medstock_token');
      localStorage.removeItem('medstock_user');
      if (location.pathname !== '/login') location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
