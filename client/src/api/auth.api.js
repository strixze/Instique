import api from './axios';

export const authApi = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  logout: (data = {}) => api.post('/auth/logout', data),
  refresh: (data = {}) => api.post('/auth/refresh', data),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (data) => api.put('/auth/profile', data),
  changePassword: (data) => api.post('/auth/change-password', data),
  getSessions: () => api.get('/auth/sessions'),
  revokeSession: (token) => api.delete(`/auth/sessions/${token}`),
  verifyActivationToken: (token) => api.get('/auth/activate-account/verify', { params: { token } }),
  activateAccount: (data) => api.post('/auth/activate-account', data),
  forgotPassword: (data) => api.post('/auth/forgot-password', data),
  verifyResetToken: (token) => api.get('/auth/reset-password/verify', { params: { token } }),
  resetPassword: (data) => api.post('/auth/reset-password', data),
};

