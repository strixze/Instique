import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';

const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

const PUBLIC_PATH_PREFIXES = [
  '/login',
  '/register',
  '/activate-account',
  '/forgot-password',
  '/reset-password',
];

api.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    const original = error.config;
    const isPublicRoute = PUBLIC_PATH_PREFIXES.some((path) =>
      window.location.pathname.startsWith(path)
    );

    if (
      error.response?.status === 401 &&
      !original._retry &&
      !original.url?.includes('/auth/login') &&
      !original.url?.includes('/auth/activate-account') &&
      !original.url?.includes('/auth/reset-password')
    ) {
      original._retry = true;
      try {
        await axios.post(`${API_BASE}/auth/refresh`, {}, { withCredentials: true });
        return api(original);
      } catch (refreshErr) {
        if (!isPublicRoute && window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
        return Promise.reject(error.response?.data || error);
      }
    }
    return Promise.reject(error.response?.data || error);
  }
);

export default api;
