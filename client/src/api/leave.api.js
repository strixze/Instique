import api from './axios';

export const leaveApi = {
  getAll: (params) => api.get('/leaves', { params }),
  getById: (id) => api.get(`/leaves/${id}`),
  getAffectedLectures: (id) => api.get(`/leaves/${id}/affected-lectures`),
  getSubstitutionOptions: (id) => api.get(`/leaves/${id}/substitution-options`),
  getMyLeaves: (params) => api.get('/leaves/my', { params }),
  getClassRequests: (params) => api.get('/leaves', { params: { ...params, view: 'class' } }),
  getMyChildrenLeaves: (params) => api.get('/leaves', { params: { ...params, view: 'children' } }),
  getStudentLeaves: (studentId, params) => api.get('/leaves', { params: { ...params, studentId } }),
  create: (data) => api.post('/leaves', data),
  approve: (id, data = {}) => api.post(`/leaves/${id}/approve`, data),
  reject: (id, data) => api.post(`/leaves/${id}/reject`, data),
  cancel: (id, notes) => api.put(`/leaves/${id}/cancel`, { notes }),
};
