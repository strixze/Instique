import { Router } from 'express';
import { createTeacher, getTeachers, getTeacherById, updateTeacher, deleteTeacher, getWorkloadAnalytics } from '../controllers/teacher.controller.js';
import authMiddleware from '../middlewares/auth.middleware.js';
import { requireRole } from '../middlewares/rbac.middleware.js';
import tenantMiddleware from '../middlewares/tenant.middleware.js';
import validate from '../middlewares/validate.middleware.js';
import { createTeacherSchema, updateTeacherSchema } from '../validators/teacher.validator.js';

const router = Router();

router.use(authMiddleware, tenantMiddleware);

router.get('/workload', requireRole('school_admin'), getWorkloadAnalytics);
router.get('/', requireRole('school_admin', 'teacher'), getTeachers);
router.get('/:id', requireRole('school_admin', 'teacher'), getTeacherById);
router.post('/', requireRole('school_admin'), validate(createTeacherSchema), createTeacher);
router.put('/:id', requireRole('school_admin'), validate(updateTeacherSchema), updateTeacher);
router.delete('/:id', requireRole('school_admin'), deleteTeacher);

export default router;
