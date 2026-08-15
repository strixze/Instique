import { Router } from 'express';
import { getAuditLogs } from '../controllers/audit.controller.js';
import authMiddleware from '../middlewares/auth.middleware.js';
import { requireRole } from '../middlewares/rbac.middleware.js';
import tenantMiddleware from '../middlewares/tenant.middleware.js';

const router = Router();

router.use(authMiddleware, tenantMiddleware);

router.get('/', requireRole('super_admin', 'school_admin'), getAuditLogs);

export default router;
