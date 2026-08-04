import api from './axios';

export const timetableApi = {
  getAll: (params) => api.get('/timetables', { params }),
  getById: (id) => api.get(`/timetables/${id}`),
  getByClassSection: (classId, sectionId) => api.get(`/timetables/by-class/${classId}/section/${sectionId}`),
  generate: (data) => api.post('/timetables/generate', data),
  updatePeriods: (id, periods) => api.put(`/timetables/${id}/periods`, { periods }),
  publish: (id, status) => api.put(`/timetables/${id}/status`, { status }),
  delete: (id) => api.delete(`/timetables/${id}`),
  findSubstitutes: (teacherId, periodId) => api.get(`/timetables/substitutes/${teacherId}/period/${periodId}`),
};
