import { Router } from 'express';
import {
  getSettings,
  updateSettings,
  updateSection,
  getPublicSettings,
} from '../controllers/setting.controller.js';
import authMiddleware from '../middlewares/auth.middleware.js';
import { requireRole } from '../middlewares/rbac.middleware.js';
import tenantMiddleware from '../middlewares/tenant.middleware.js';

const router = Router();

router.use(authMiddleware, tenantMiddleware);

// Public settings for all authenticated users in this school
router.get('/public', getPublicSettings);

// School Admin management endpoints
router.get('/', requireRole('school_admin'), getSettings);
router.put('/', requireRole('school_admin'), updateSettings);
router.patch('/:section', requireRole('school_admin'), updateSection);

export default router;
