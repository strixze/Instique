import api from './axios';

export const attendanceApi = {
  mark: (data) => api.post('/attendance', data),
  markAllPresent: (data) => api.post('/attendance/mark-all', data),
  getAll: (params) => api.get('/attendance', { params }),
  getStudentAttendance: (studentId, params) => api.get(`/attendance/student/${studentId}`, { params }),
  getReport: (params) => api.get('/attendance/report', { params }),
};
