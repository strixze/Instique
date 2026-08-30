import { Router } from 'express';
import { createLeave, getLeaves, getLeaveById, processLeave, getMyLeaves } from '../controllers/leave.controller.js';
import authMiddleware from '../middlewares/auth.middleware.js';
import { requireRole } from '../middlewares/rbac.middleware.js';
import tenantMiddleware from '../middlewares/tenant.middleware.js';
import validate from '../middlewares/validate.middleware.js';
import { createLeaveSchema, processLeaveSchema } from '../validators/leave.validator.js';

const router = Router();

router.use(authMiddleware, tenantMiddleware);

router.get('/my', requireRole('teacher', 'student', 'parent'), getMyLeaves);
router.get('/', requireRole('school_admin', 'teacher', 'student', 'parent'), getLeaves);
router.get('/:id', requireRole('school_admin', 'teacher', 'student', 'parent'), getLeaveById);
router.post('/', requireRole('teacher', 'student', 'parent'), validate(createLeaveSchema), createLeave);
router.put('/:id/process', requireRole('school_admin'), validate(processLeaveSchema), processLeave);

export default router;

