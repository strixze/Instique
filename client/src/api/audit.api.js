import client from './axios';

export const auditApi = {
  getAuditLogs: (params) => client.get('/audit-logs', { params }),
};
