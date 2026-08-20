import api from './axios';

export const eventApi = {
  getAll: (params) => api.get('/events', { params }),
  getById: (id) => api.get(`/events/${id}`),
  create: (data) => api.post('/events', data),
  update: (id, data) => api.put(`/events/${id}`, data),
  delete: (id) => api.delete(`/events/${id}`),
  getCalendar: (params) => api.get('/events/calendar', { params }),
  
  // Gallery Photo endpoints
  getPhotos: (eventId, params) => api.get(`/events/${eventId}/photos`, { params }),
  uploadPhotos: (eventId, formData, onUploadProgress) =>
    api.post(`/events/${eventId}/photos`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress,
    }),
  updatePhotoCaption: (eventId, photoId, data) =>
    api.put(`/events/${eventId}/photos/${photoId}`, data),
  setCoverPhoto: (eventId, photoId) =>
    api.put(`/events/${eventId}/photos/${photoId}/cover`),
  deletePhoto: (eventId, photoId) =>
    api.delete(`/events/${eventId}/photos/${photoId}`),
};
