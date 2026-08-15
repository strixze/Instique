import { Router } from 'express';
import { createParent, getParents, getParentById, updateParent } from '../controllers/parent.controller.js';
import authMiddleware from '../middlewares/auth.middleware.js';
import { requireRole } from '../middlewares/rbac.middleware.js';
import tenantMiddleware from '../middlewares/tenant.middleware.js';

const router = Router();

router.use(authMiddleware, tenantMiddleware);

router.get('/', requireRole('school_admin', 'teacher'), getParents);
router.get('/:id', requireRole('school_admin', 'teacher', 'parent'), getParentById);
router.post('/', requireRole('school_admin'), createParent);
router.put('/:id', requireRole('school_admin'), updateParent);

export default router;
