import api from './axios';

export const admissionApi = {
  getAll: (params) => api.get('/admissions', { params }),
  getById: (id) => api.get(`/admissions/${id}`),
  create: (data) => api.post('/admissions', data),
  updateStatus: (id, data) => api.put(`/admissions/${id}/status`, data),
  uploadDocuments: (id, formData) => api.post(`/admissions/${id}/documents`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
};
