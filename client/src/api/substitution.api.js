import api from './axios';

export const substitutionApi = {
  getAll: (params) => api.get('/substitutions', { params }),
  getMySubstitutions: (params) => api.get('/substitutions/my', { params }),
  getEligibleTeachersForSlot: (params) => api.get('/substitutions/eligible-teachers', { params }),
  cancel: (id, data) => api.post(`/substitutions/${id}/cancel`, data),
};
