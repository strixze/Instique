import AuditLog from '../models/AuditLog.js';
import { paginate } from '../utils/pagination.js';

export const getAuditLogs = async (schoolId, options = {}) => {
  const { page, limit, search, entity, action } = options;
  const filterQuery = {};
  if (schoolId) filterQuery.schoolId = schoolId;
  if (entity && entity !== 'all') filterQuery.entity = { $regex: entity, $options: 'i' };
  if (action && action !== 'all') filterQuery.action = { $regex: action, $options: 'i' };

  return paginate(
    AuditLog,
    filterQuery,
    {
      page,
      limit,
      search,
      searchFields: ['action', 'entity'],
      populate: { path: 'actor', select: 'name email role avatar' },
      sort: '-createdAt',
    }
  );
};

export const createAuditLog = async (data) => {
  return AuditLog.create(data);
};
