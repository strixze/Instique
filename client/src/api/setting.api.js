import api from './axios';

export const settingApi = {
  get: () => api.get('/settings'),
  update: (data) => api.put('/settings', data),
  updateSection: (section, data) => api.patch(`/settings/${section}`, data),
  getPublic: () => api.get('/settings/public'),
};
