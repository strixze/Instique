import api from './axios';

export const academicApi = {
  getAcademicYears: (params) => api.get('/academic/academic-years', { params }),
  createAcademicYear: (data) => api.post('/academic/academic-years', data),
  updateAcademicYear: (id, data) => api.put(`/academic/academic-years/${id}`, data),
  deleteAcademicYear: (id) => api.delete(`/academic/academic-years/${id}`),

  getClasses: (params) => api.get('/academic/classes', { params }),
  getClassById: (id) => api.get(`/academic/classes/${id}`),
  createClass: (data) => api.post('/academic/classes', data),
  updateClass: (id, data) => api.put(`/academic/classes/${id}`, data),
  deleteClass: (id) => api.delete(`/academic/classes/${id}`),

  getSections: (params) => api.get('/academic/sections', { params }),
  getSectionsByClass: (classId) => api.get(`/academic/sections/by-class/${classId}`),
  createSection: (data) => api.post('/academic/sections', data),
  updateSection: (id, data) => api.put(`/academic/sections/${id}`, data),
  deleteSection: (id) => api.delete(`/academic/sections/${id}`),

  getSubjects: (params) => api.get('/academic/subjects', { params }),
  createSubject: (data) => api.post('/academic/subjects', data),
  updateSubject: (id, data) => api.put(`/academic/subjects/${id}`, data),
  deleteSubject: (id) => api.delete(`/academic/subjects/${id}`),
};
