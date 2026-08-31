import api from './axios';

export const homeworkApi = {
  getMyAssignments: () => api.get('/homework/my-assignments'),
  getAll: (params) => api.get('/homework', { params }),
  getById: (id) => api.get(`/homework/${id}`),
  create: (formDataOrJson) => {
    const isFormData = formDataOrJson instanceof FormData;
    return api.post('/homework', formDataOrJson, {
      headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : {},
    });
  },
  update: (id, formDataOrJson) => {
    const isFormData = formDataOrJson instanceof FormData;
    return api.put(`/homework/${id}`, formDataOrJson, {
      headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : {},
    });
  },
  publish: (id) => api.patch(`/homework/${id}/publish`),
  cancel: (id) => api.patch(`/homework/${id}/cancel`),
  delete: (id) => api.delete(`/homework/${id}`),
  submit: (id, formDataOrJson) => {
    const isFormData = formDataOrJson instanceof FormData;
    return api.post(`/homework/${id}/submit`, formDataOrJson, {
      headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : {},
    });
  },
};
