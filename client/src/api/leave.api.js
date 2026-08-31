import api from './axios';

export const leaveApi = {
  getAll: (params) => api.get('/leaves', { params }),
  getById: (id) => api.get(`/leaves/${id}`),
  getAffectedLectures: (id) => api.get(`/leaves/${id}/affected-lectures`),
  getSubstitutionOptions: (id) => api.get(`/leaves/${id}/substitution-options`),
  getMyLeaves: (params) => api.get('/leaves/my', { params }),
  create: (data) => api.post('/leaves', data),
  approve: (id, data) => api.post(`/leaves/${id}/approve`, data),
  reject: (id, data) => api.post(`/leaves/${id}/reject`, data),
  cancel: (id, notes) => api.put(`/leaves/${id}/cancel`, { notes }),
};
