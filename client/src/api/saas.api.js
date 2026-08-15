import api from './axios';

export const saasApi = {
  getInstallments: () => api.get('/saas/installments'),
  createInstallments: (data) => api.post('/saas/installments', data),
};
