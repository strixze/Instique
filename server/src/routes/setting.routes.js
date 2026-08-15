import { Router } from 'express';
import { getSettings, updateSettings } from '../controllers/setting.controller.js';
import authMiddleware from '../middlewares/auth.middleware.js';
import { requireRole } from '../middlewares/rbac.middleware.js';
import tenantMiddleware from '../middlewares/tenant.middleware.js';

const router = Router();

router.use(authMiddleware, tenantMiddleware);

router.get('/', requireRole('school_admin'), getSettings);
router.put('/', requireRole('school_admin'), updateSettings);

export default router;
