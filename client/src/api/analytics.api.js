import api from './axios';

export const analyticsApi = {
  getOverview: (params) => api.get('/analytics/overview', { params }),
  getStudents: (params) => api.get('/analytics/students', { params }),
  getAttendance: (params) => api.get('/analytics/attendance', { params }),
  getAcademics: (params) => api.get('/analytics/academics', { params }),
  getFees: (params) => api.get('/analytics/fees', { params }),
  getAdmissions: (params) => api.get('/analytics/admissions', { params }),
  getTeachers: (params) => api.get('/analytics/teachers', { params }),
  getHomework: (params) => api.get('/analytics/homework', { params }),
  getOperations: () => api.get('/analytics/operations'),
  getInsights: () => api.get('/analytics/insights'),
  getActivity: (limit = 10) => api.get('/analytics/activity', { params: { limit } }),
  exportReport: (params) => api.get('/analytics/export', { params }),
};
