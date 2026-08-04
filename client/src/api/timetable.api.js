import api from './axios';

export const timetableApi = {
  getAll: (params) => api.get('/timetables', { params }),
  getById: (id) => api.get(`/timetables/${id}`),
  getByClassSection: (classId, sectionId) => api.get(`/timetables/by-class/${classId}/section/${sectionId}`),
  generate: (data) => api.post('/timetables/generate', data),
  generateBulk: (data) => api.post('/timetables/generate-bulk', data),
  regeneratePartial: (id) => api.post(`/timetables/${id}/regenerate-partial`),
  updatePeriods: (id, periods) => api.put(`/timetables/${id}/periods`, { periods }),
  manualEdit: (id, editData) => api.put(`/timetables/${id}/edit`, editData),
  swapPeriods: (id, swapData) => api.put(`/timetables/${id}/swap`, swapData),
  lockPeriods: (id, lockData) => api.put(`/timetables/${id}/lock`, lockData),
  publish: (id, status) => api.put(`/timetables/${id}/status`, { status }),
  delete: (id) => api.delete(`/timetables/${id}`),
  
  // Custom views
  getTeacherTimetable: (teacherId) => api.get(`/timetables/teacher/${teacherId}`),
  getSubjectTimetable: (subjectId) => api.get(`/timetables/subject/${subjectId}`),
  getDailyView: (day) => api.get(`/timetables/daily/${day}`),
  
  // Reports
  getConflictReport: (id) => api.get(`/timetables/${id}/report/conflicts`),
  getTeacherWorkloadReport: (academicYear) => api.get('/timetables/report/workload', { params: { academicYear } }),
  getSubjectDistributionReport: (academicYear) => api.get('/timetables/report/distribution', { params: { academicYear } }),

  // Substitutes
  findSubstitutes: (teacherId, periodId) => api.get(`/timetables/substitutes/${teacherId}/period/${periodId}`),

  // Timetable configurations
  getConfig: (academicYear) => api.get('/timetable-configs', { params: { academicYear } }),
  createConfig: (data) => api.post('/timetable-configs', data),
  updateConfig: (id, data) => api.put(`/timetable-configs/${id}`, data),
};
