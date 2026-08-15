import { Router } from 'express';
import { createConfig, getConfig, updateConfig } from '../controllers/timetableConfig.controller.js';
import authMiddleware from '../middlewares/auth.middleware.js';
import { requireRole } from '../middlewares/rbac.middleware.js';
import tenantMiddleware from '../middlewares/tenant.middleware.js';
import validate from '../middlewares/validate.middleware.js';
import { createConfigSchema, updateConfigSchema } from '../validators/timetableConfig.validator.js';

const router = Router();

router.use(authMiddleware, tenantMiddleware);

router.post('/', requireRole('school_admin'), validate(createConfigSchema), createConfig);
router.get('/', requireRole('school_admin'), getConfig);
router.put('/:id', requireRole('school_admin'), validate(updateConfigSchema), updateConfig);

export default router;
