import api from './axios';

export const eventApi = {
  getAll: (params) => api.get('/events', { params }),
  getById: (id) => api.get(`/events/${id}`),
  create: (data) => api.post('/events', data),
  update: (id, data) => api.put(`/events/${id}`, data),
  publish: (id) => api.put(`/events/${id}/publish`),
  cancel: (id) => api.put(`/events/${id}/cancel`),
  delete: (id) => api.delete(`/events/${id}`),
  getCalendar: (params) => api.get('/events/calendar', { params }),
  getStats: () => api.get('/events/stats'),
};
