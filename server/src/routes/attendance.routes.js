import { Router } from 'express';
import { markAttendance, markAllPresent, getAttendance, getStudentAttendance, getAttendanceReport, getStudentsByClassSection, getAttendanceForDate } from '../controllers/attendance.controller.js';
import authMiddleware from '../middlewares/auth.middleware.js';
import { requireRole } from '../middlewares/rbac.middleware.js';
import tenantMiddleware from '../middlewares/tenant.middleware.js';
import validate from '../middlewares/validate.middleware.js';
import { markAttendanceSchema, bulkMarkAttendanceSchema } from '../validators/attendance.validator.js';

const router = Router();

router.use(authMiddleware, tenantMiddleware);

router.post('/', requireRole('teacher', 'school_admin'), validate(markAttendanceSchema), markAttendance);
router.post('/mark-all', requireRole('teacher', 'school_admin'), validate(bulkMarkAttendanceSchema), markAllPresent);
router.get('/', requireRole('school_admin', 'teacher', 'parent'), getAttendance);
router.get('/report', requireRole('school_admin', 'teacher'), getAttendanceReport);
router.get('/students', requireRole('school_admin', 'teacher'), getStudentsByClassSection);
router.get('/for-date', requireRole('school_admin', 'teacher'), getAttendanceForDate);
router.get('/student/:studentId', requireRole('school_admin', 'teacher', 'parent', 'student'), getStudentAttendance);

export default router;
