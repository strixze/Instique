import api from './axios';

export const parentMeetingApi = {
  getAll: (params) => api.get('/meetings', { params }),
  getById: (id) => api.get(`/meetings/${id}`),
  getStats: () => api.get('/meetings/stats'),
  preview: (data) => api.post('/meetings/preview', data),
  create: (data) => api.post('/meetings', data),
  update: (id, data) => api.put(`/meetings/${id}`, data),
  remove: (id) => api.delete(`/meetings/${id}`),
  publish: (id) => api.patch(`/meetings/${id}/publish`),
  cancel: (id, reason) => api.patch(`/meetings/${id}/cancel`, { reason }),
  complete: (id) => api.patch(`/meetings/${id}/complete`),
  rsvp: (id, rsvpStatus) => api.post(`/meetings/${id}/rsvp`, { rsvpStatus }),
  getParticipants: (id) => api.get(`/meetings/${id}/participants`),
  markAttendance: (id, participantId, status) => api.patch(`/meetings/${id}/attendance`, { participantId, status }),
  bulkAttendance: (id, updates) => api.patch(`/meetings/${id}/attendance/bulk`, { updates }),
  addNote: (id, data) => api.post(`/meetings/${id}/notes`, data),
  updateNote: (id, noteId, data) => api.patch(`/meetings/${id}/notes/${noteId}`, data),
  deleteNote: (id, noteId) => api.delete(`/meetings/${id}/notes/${noteId}`),
};