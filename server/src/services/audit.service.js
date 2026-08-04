import AuditLog from '../models/AuditLog.js';
import { paginate } from '../utils/pagination.js';

export const getAuditLogs = async (schoolId, options) => {
  return paginate(AuditLog, { schoolId }, { ...options, sort: '-createdAt' });
};

export const createAuditLog = async (data) => {
  return AuditLog.create(data);
};
