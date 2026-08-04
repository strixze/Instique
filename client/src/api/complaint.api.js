import api from './axios';

export const complaintApi = {
  getAll: (params) => api.get('/complaints', { params }),
  getById: (id) => api.get(`/complaints/${id}`),
  create: (data) => api.post('/complaints', data),
  process: (id, data) => api.put(`/complaints/${id}/process`, data),
};
