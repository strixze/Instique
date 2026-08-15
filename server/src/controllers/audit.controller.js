import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/ApiResponse.js';
import * as auditService from '../services/audit.service.js';

export const getAuditLogs = asyncHandler(async (req, res) => {
  const result = await auditService.getAuditLogs(req.schoolId, req.query);
  res.status(200).json(new ApiResponse(200, result.data, 'Audit logs fetched', result.meta));
});
