import { Router } from 'express';
import { generateTimetable, getTimetables, getTimetableById, getTimetableByClassSection, updateTimetablePeriods, publishTimetable, deleteTimetable, findSubstitutes } from '../controllers/timetable.controller.js';
import authMiddleware from '../middlewares/auth.middleware.js';
import { requireRole } from '../middlewares/rbac.middleware.js';
import tenantMiddleware from '../middlewares/tenant.middleware.js';
import validate from '../middlewares/validate.middleware.js';
import { generateTimetableSchema, updateTimetableSchema, publishTimetableSchema } from '../validators/timetable.validator.js';

const router = Router();

router.use(authMiddleware, tenantMiddleware);

router.post('/generate', requireRole('school_admin'), validate(generateTimetableSchema), generateTimetable);
router.get('/', requireRole('school_admin', 'teacher'), getTimetables);
router.get('/by-class/:classId/section/:sectionId', requireRole('school_admin', 'teacher', 'student', 'parent'), getTimetableByClassSection);
router.get('/:id', requireRole('school_admin', 'teacher'), getTimetableById);
router.put('/:id/periods', requireRole('school_admin'), validate(updateTimetableSchema), updateTimetablePeriods);
router.put('/:id/status', requireRole('school_admin'), validate(publishTimetableSchema), publishTimetable);
router.delete('/:id', requireRole('school_admin'), deleteTimetable);
router.get('/substitutes/:teacherId/period/:periodId', requireRole('school_admin'), findSubstitutes);

export default router;
