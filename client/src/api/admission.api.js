import api from './axios';

export const admissionApi = {
  getAll: (params) => api.get('/admissions', { params }),
  getStats: () => api.get('/admissions/stats'),
  getById: (id) => api.get(`/admissions/${id}`),
  create: (data) => api.post('/admissions', data),
  updateStatus: (id, data) => api.put(`/admissions/${id}/status`, data),
  uploadDocuments: (id, formData) => api.post(`/admissions/${id}/documents`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  
  // New workflow APIs
  updateDocumentStatus: (id, documentId, data) => api.put(`/admissions/${id}/documents/${documentId}/status`, data),
  allocateClassSection: (id, data) => api.put(`/admissions/${id}/allocate-class`, data),
  assignFeeStructure: (id, data) => api.put(`/admissions/${id}/assign-fee`, data),
  recordManualPayment: (id, data) => api.put(`/admissions/${id}/record-payment`, data),
  confirmAdmission: (id) => api.put(`/admissions/${id}/confirm`),
};
