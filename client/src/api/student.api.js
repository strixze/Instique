import api from './axios';

export const studentApi = {
  getAll: (params) => api.get('/students', { params }),
  getById: (id) => api.get(`/students/${id}`),
  getProfile: (id) => api.get(`/students/${id}/profile`),
  create: (data) => api.post('/students', data),
  update: (id, data) => api.put(`/students/${id}`, data),
  delete: (id) => api.delete(`/students/${id}`),
  bulkCreate: (students) => api.post('/students/bulk', { students }),
  promote: (data) => api.post('/students/promote', data),
  sendParentPasswordReset: (studentId, parentId) =>
    api.post(`/students/${studentId}/parent/reset-password`, { parentId }),
};
