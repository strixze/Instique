import { Router } from 'express';
import {
  createLeave,
  getLeaves,
  getLeaveById,
  getAffectedLectures,
  approveLeave,
  rejectLeave,
  cancelLeave,
  getMyLeaves,
} from '../controllers/leave.controller.js';
import authMiddleware from '../middlewares/auth.middleware.js';
import { requireRole } from '../middlewares/rbac.middleware.js';
import tenantMiddleware from '../middlewares/tenant.middleware.js';
import validate from '../middlewares/validate.middleware.js';
import { createLeaveSchema, approveLeaveSchema, rejectLeaveSchema } from '../validators/leave.validator.js';

const router = Router();

router.use(authMiddleware, tenantMiddleware);

router.get('/my', requireRole('teacher', 'student', 'parent'), getMyLeaves);
router.get('/', requireRole('school_admin', 'teacher', 'student', 'parent'), getLeaves);
router.get('/:id/affected-lectures', requireRole('school_admin'), getAffectedLectures);
router.get('/:id/substitution-options', requireRole('school_admin'), getAffectedLectures);
router.get('/:id', requireRole('school_admin', 'teacher', 'student', 'parent'), getLeaveById);
router.post('/', requireRole('teacher', 'student', 'parent'), validate(createLeaveSchema), createLeave);
router.post('/:id/approve', requireRole('school_admin'), validate(approveLeaveSchema), approveLeave);
router.post('/:id/reject', requireRole('school_admin'), validate(rejectLeaveSchema), rejectLeave);
router.put('/:id/cancel', requireRole('school_admin', 'teacher', 'student', 'parent'), cancelLeave);

export default router;
