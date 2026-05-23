import axios from 'axios';

// In dev, Vite proxies /api to the backend. In production set VITE_API_URL.
const baseURL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({ baseURL });

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
