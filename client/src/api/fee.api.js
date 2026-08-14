import api from './axios';

export const feeApi = {
  getStructures: (params) => api.get('/fees/structures', { params }),
  getStructureById: (id) => api.get(`/fees/structures/${id}`),
  createStructure: (data) => api.post('/fees/structures', data),
  updateStructure: (id, data) => api.put(`/fees/structures/${id}`, data),
  deleteStructure: (id) => api.delete(`/fees/structures/${id}`),
  getTransactions: (params) => api.get('/fees/transactions', { params }),
  recordPayment: (data) => api.post('/fees/payments', data),
  payPendingFee: (id, data) => api.put(`/fees/transactions/${id}/pay`, data),
  getStudentStatus: (studentId) => api.get(`/fees/student/${studentId}`),
  getReport: () => api.get('/fees/report'),
  importStructures: (formData) => api.post('/fees/structures/import', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
};
