import api from './axios';

export const teacherApi = {
  getAll: (params) => api.get('/teachers', { params }),
  getById: (id) => api.get(`/teachers/${id}`),
  getProfile: (id) => api.get(`/teachers/${id}/profile`),
  create: (data) => api.post('/teachers', data),
  update: (id, data) => api.put(`/teachers/${id}`, data),
  delete: (id) => api.delete(`/teachers/${id}`),
  getWorkload: () => api.get('/teachers/workload'),
  resendActivation: (id) => api.post(`/teachers/${id}/resend-activation`),
  sendPasswordReset: (id) => api.post(`/teachers/${id}/send-password-reset`),
};
