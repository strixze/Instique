import { Router } from 'express';
import {
  getOverview,
  getStudents,
  getAttendance,
  getAcademics,
  getFees,
  getAdmissions,
  getTeachers,
  getHomework,
  getOperations,
  getInsights,
  getRecentActivity,
  exportReport,
} from '../controllers/analytics.controller.js';
import authMiddleware from '../middlewares/auth.middleware.js';
import { requireRole } from '../middlewares/rbac.middleware.js';
import tenantMiddleware from '../middlewares/tenant.middleware.js';

const router = Router();

// Protect all analytics endpoints for school admin only
router.use(authMiddleware);
router.use(tenantMiddleware);
router.use(requireRole('school_admin'));

router.get('/overview', getOverview);
router.get('/students', getStudents);
router.get('/attendance', getAttendance);
router.get('/academics', getAcademics);
router.get('/fees', getFees);
router.get('/admissions', getAdmissions);
router.get('/teachers', getTeachers);
router.get('/homework', getHomework);
router.get('/operations', getOperations);
router.get('/insights', getInsights);
router.get('/activity', getRecentActivity);
router.get('/export', exportReport);

export default router;
