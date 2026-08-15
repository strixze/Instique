import api from './axios';

export const examApi = {
  getAll: (params) => api.get('/exams', { params }),
  getById: (id) => api.get(`/exams/${id}`),
  create: (data) => api.post('/exams', data),
  update: (id, data) => api.put(`/exams/${id}`, data),
  delete: (id) => api.delete(`/exams/${id}`),
  enterMark: (data) => api.post('/exams/marks', data),
  getMarks: (params) => api.get('/exams/marks/all', { params }),
  getMarksByExam: (examId) => api.get(`/exams/${examId}/marks`),
  publishResults: (examId) => api.put(`/exams/${examId}/publish`),
  getExamStudents: (examId) => api.get(`/exams/${examId}/students`),
  saveMarksBulk: (examId, data) => api.post(`/exams/${examId}/marks/bulk`, data),
  getExamResults: (examId) => api.get(`/exams/${examId}/results`),
};
