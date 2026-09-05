import api from './axios';

export const syllabusApi = {
  getAll: (params) => api.get('/syllabus', { params }),
  getById: (id) => api.get(`/syllabus/${id}`),
  create: (data) => api.post('/syllabus', data),
  update: (id, data) => api.put(`/syllabus/${id}`, data),
  delete: (id) => api.delete(`/syllabus/${id}`),
  publish: (id) => api.post(`/syllabus/${id}/publish`),
  archive: (id) => api.post(`/syllabus/${id}/archive`),
  assignSections: (id, sectionIds) => api.post(`/syllabus/${id}/assign-sections`, { sectionIds }),

  getTrackById: (trackId) => api.get(`/syllabus/tracks/${trackId}`),
  updateTopicProgress: (trackId, topicId, data) =>
    api.patch(`/syllabus/tracks/${trackId}/topics/${topicId}/progress`, data),

  getAnalytics: () => api.get('/syllabus/analytics/overview'),
  getTeacherSyllabus: () => api.get('/syllabus/teacher/me'),
  getParentChildSyllabus: (studentId) => api.get(`/syllabus/parent/child/${studentId}`),
};
