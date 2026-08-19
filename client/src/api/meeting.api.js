import api from './axios';

export const meetingApi = {
  getAll: (params) => api.get('/meetings', { params }),
  getStats: () => api.get('/meetings/stats'),
  getById: (id) => api.get(`/meetings/${id}`),
  create: (data) => api.post('/meetings', data),
  update: (id, data) => api.put(`/meetings/${id}`, data),
  publish: (id) => api.patch(`/meetings/${id}/publish`),
  cancel: (id) => api.patch(`/meetings/${id}/cancel`),
  rsvp: (id, data) => api.post(`/meetings/${id}/rsvp`, data),
  markAttendance: (id, data) => api.patch(`/meetings/${id}/attendance`, data),
  saveNotes: (id, data) => api.post(`/meetings/${id}/notes`, data),
  exportReport: (id) => api.get(`/meetings/${id}/export`, { responseType: 'blob' }),
  delete: (id) => api.delete(`/meetings/${id}`),
};
