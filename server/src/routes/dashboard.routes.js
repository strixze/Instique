import { Router } from 'express';
import { getSuperAdminDashboard, getSchoolAdminDashboard, getTeacherDashboard, getStudentDashboard, getParentDashboard } from '../controllers/dashboard.controller.js';
import authMiddleware from '../middlewares/auth.middleware.js';
import { requireRole } from '../middlewares/rbac.middleware.js';
import tenantMiddleware from '../middlewares/tenant.middleware.js';

const router = Router();

router.use(authMiddleware);

router.get('/super-admin', requireRole('super_admin'), getSuperAdminDashboard);
router.get('/school-admin', tenantMiddleware, requireRole('school_admin'), getSchoolAdminDashboard);
router.get('/teacher', tenantMiddleware, requireRole('teacher'), getTeacherDashboard);
router.get('/student', tenantMiddleware, requireRole('student'), getStudentDashboard);
router.get('/parent', tenantMiddleware, requireRole('parent'), getParentDashboard);

export default router;
