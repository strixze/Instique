import api from './axios';

export const leaveApi = {
  getAll: (params) => api.get('/leaves', { params }),
  getById: (id) => api.get(`/leaves/${id}`),
  getMyLeaves: (params) => api.get('/leaves/my', { params }),
  create: (data) => api.post('/leaves', data),
  process: (id, data) => api.put(`/leaves/${id}/process`, data),
};
