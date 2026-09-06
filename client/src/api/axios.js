import axios from 'axios';
import { useUserStore } from '../store/userStore';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';

if (
  typeof window !== 'undefined' &&
  window.location.hostname !== 'localhost' &&
  window.location.hostname !== '127.0.0.1' &&
  API_BASE.includes('localhost')
) {
  console.warn(
    '[Instique Config] VITE_API_BASE_URL points to localhost in a production environment. ' +
    'Configure VITE_API_BASE_URL in Vercel environment settings pointing to your backend URL.'
  );
}

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

// Attach Authorization Bearer header if token exists
api.interceptors.request.use(
  (config) => {
    const token = useUserStore.getState().token;
    if (token && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Concurrency queue for token refresh
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    const original = error.config;
    const isPublicRoute = PUBLIC_PATH_PREFIXES.some((path) =>
      typeof window !== 'undefined' && window.location.pathname.startsWith(path)
    );

    // If 401 and request has not already retried
    if (
      error.response?.status === 401 &&
      original &&
      !original._retry &&
      !original.url?.includes('/auth/login') &&
      !original.url?.includes('/auth/activate-account') &&
      !original.url?.includes('/auth/reset-password') &&
      !original.url?.includes('/auth/refresh')
    ) {
      if (isRefreshing) {
        // Queue concurrent requests while refresh is in progress
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((newToken) => {
            if (newToken) {
              original.headers.Authorization = `Bearer ${newToken}`;
            }
            return api(original);
          })
          .catch((err) => Promise.reject(err));
      }

      original._retry = true;
      isRefreshing = true;

      const currentRefreshToken = useUserStore.getState().refreshToken;

      try {
        const response = await axios.post(
          `${API_BASE}/auth/refresh`,
          { refreshToken: currentRefreshToken },
          { withCredentials: true }
        );

        const newAccessToken = response.data?.data?.accessToken;
        const newRefreshToken = response.data?.data?.refreshToken;

        if (newAccessToken) {
          useUserStore.getState().setToken(newAccessToken);
        }
        if (newRefreshToken) {
          useUserStore.getState().setRefreshToken(newRefreshToken);
        }

        processQueue(null, newAccessToken);

        if (newAccessToken) {
          original.headers.Authorization = `Bearer ${newAccessToken}`;
        }
        return api(original);
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        useUserStore.getState().logout();

        if (typeof window !== 'undefined' && !isPublicRoute && window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
        return Promise.reject(error.response?.data || error);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error.response?.data || error);
  }
);

export default api;

