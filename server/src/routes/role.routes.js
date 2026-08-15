import { Router } from 'express';
import { createRole, getRoles, getRoleById, updateRole, deleteRole, assignRole } from '../controllers/role.controller.js';
import authMiddleware from '../middlewares/auth.middleware.js';
import { requireRole } from '../middlewares/rbac.middleware.js';
import tenantMiddleware from '../middlewares/tenant.middleware.js';
import validate from '../middlewares/validate.middleware.js';
import { createRoleSchema, assignRoleSchema } from '../validators/role.validator.js';

const router = Router();

router.use(authMiddleware, tenantMiddleware);

router.get('/', requireRole('school_admin'), getRoles);
router.get('/:id', requireRole('school_admin'), getRoleById);
router.post('/', requireRole('school_admin'), validate(createRoleSchema), createRole);
router.put('/:id', requireRole('school_admin'), updateRole);
router.delete('/:id', requireRole('school_admin'), deleteRole);
router.post('/assign', requireRole('school_admin'), validate(assignRoleSchema), assignRole);

export default router;
