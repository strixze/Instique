import api from './axios';

export const parentApi = {
  getAll: (params) => api.get('/parents', { params }),
  getById: (id) => api.get(`/parents/${id}`),
  getMyChildren: () => api.get('/parents/my-children'),
  getChildDashboard: (studentId) => api.get(`/parents/children/${studentId}/dashboard`),
  create: (data) => api.post('/parents', data),
  update: (id, data) => api.put(`/parents/${id}`, data),
  resendActivationEmail: (id) => api.post(`/parents/${id}/resend-activation`),
};


