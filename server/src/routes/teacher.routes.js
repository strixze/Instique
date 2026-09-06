import { Router } from 'express';
import {
  createTeacher,
  getTeachers,
  getTeacherById,
  getTeacherProfile,
  updateTeacher,
  deleteTeacher,
  getWorkloadAnalytics,
  resendTeacherActivationEmail,
  sendTeacherPasswordReset,
} from '../controllers/teacher.controller.js';
import authMiddleware from '../middlewares/auth.middleware.js';
import { requireRole } from '../middlewares/rbac.middleware.js';
import tenantMiddleware from '../middlewares/tenant.middleware.js';
import validate from '../middlewares/validate.middleware.js';
import { createTeacherSchema, updateTeacherSchema } from '../validators/teacher.validator.js';

const router = Router();

router.use(authMiddleware, tenantMiddleware);

// Analytics — must be before /:id routes
router.get('/workload', requireRole('school_admin'), getWorkloadAnalytics);

// Core CRUD & Profile
router.get('/', requireRole('school_admin', 'teacher'), getTeachers);
router.get('/:id/profile', requireRole('school_admin', 'teacher'), getTeacherProfile);
router.get('/:id', requireRole('school_admin', 'teacher'), getTeacherById);
router.post('/', requireRole('school_admin'), validate(createTeacherSchema), createTeacher);
router.put('/:id', requireRole('school_admin'), validate(updateTeacherSchema), updateTeacher);
router.delete('/:id', requireRole('school_admin'), deleteTeacher);

// Account management
router.post('/:id/resend-activation', requireRole('school_admin'), resendTeacherActivationEmail);
router.post('/:id/send-password-reset', requireRole('school_admin'), sendTeacherPasswordReset);

export default router;
