import { Router } from 'express';
import {
  generateTimetable,
  generateBulkTimetables,
  getTimetables,
  getTimetableById,
  getTimetableByClassSection,
  updateTimetablePeriods,
  manualEdit,
  swapPeriods,
  lockPeriods,
  regeneratePartial,
  publishTimetable,
  publishClassTimetables,
  publishSchoolTimetables,
  deleteTimetable,
  deleteClassTimetables,
  deleteSchoolTimetables,
  getTeacherTimetable,
  getSubjectTimetable,
  getDailyView,
  getConflictReport,
  getTeacherWorkloadReport,
  getSubjectDistributionReport,
  exportToPdf,
  exportToExcel,
  findSubstitutes,
} from '../controllers/timetable.controller.js';
import authMiddleware from '../middlewares/auth.middleware.js';
import { requireRole } from '../middlewares/rbac.middleware.js';
import tenantMiddleware from '../middlewares/tenant.middleware.js';
import validate from '../middlewares/validate.middleware.js';
import {
  generateTimetableSchema,
  updateTimetableSchema,
  manualEditSchema,
  swapPeriodsSchema,
  lockPeriodsSchema,
  publishTimetableSchema,
  deleteClassTimetablesSchema,
  deleteSchoolTimetablesSchema,
  bulkPublishClassSchema,
  bulkPublishSchoolSchema,
} from '../validators/timetable.validator.js';

const router = Router();

router.use(authMiddleware, tenantMiddleware);

// Generation endpoints
router.post('/generate', requireRole('school_admin'), validate(generateTimetableSchema), generateTimetable);
router.post('/generate-bulk', requireRole('school_admin'), generateBulkTimetables);

// Reports (must come before /:id to avoid matching 'report' as an id)
router.get('/report/workload', requireRole('school_admin'), getTeacherWorkloadReport);
router.get('/report/distribution', requireRole('school_admin'), getSubjectDistributionReport);

// Sub-views for specific entities (must come before /:id)
router.get('/teacher/:teacherId', requireRole('school_admin', 'teacher'), getTeacherTimetable);
router.get('/subject/:subjectId', requireRole('school_admin'), getSubjectTimetable);
router.get('/daily/:day', requireRole('school_admin'), getDailyView);

// Substitute finding (must come before /:id)
router.get('/substitutes/:teacherId/period/:periodId', requireRole('school_admin'), findSubstitutes);

// Bulk operations (must come before /:id)
router.put('/bulk/school/status', requireRole('school_admin'), validate(bulkPublishSchoolSchema), publishSchoolTimetables);
router.put('/bulk/class/:classId/status', requireRole('school_admin'), validate(bulkPublishClassSchema), publishClassTimetables);
router.delete('/bulk/school', requireRole('school_admin'), validate(deleteSchoolTimetablesSchema, 'query'), deleteSchoolTimetables);
router.delete('/bulk/class/:classId', requireRole('school_admin'), validate(deleteClassTimetablesSchema, 'query'), deleteClassTimetables);

// Standard list and lookups
router.get('/', requireRole('school_admin', 'teacher'), getTimetables);
router.get('/by-class/:classId/section/:sectionId', requireRole('school_admin', 'teacher', 'student', 'parent'), getTimetableByClassSection);
router.get('/:id', requireRole('school_admin', 'teacher', 'student', 'parent'), getTimetableById);
router.get('/:id/report/conflicts', requireRole('school_admin'), getConflictReport);

// Editing actions (Admins only)
router.put('/:id/periods', requireRole('school_admin'), validate(updateTimetableSchema), updateTimetablePeriods);
router.put('/:id/edit', requireRole('school_admin'), validate(manualEditSchema), manualEdit);
router.put('/:id/swap', requireRole('school_admin'), validate(swapPeriodsSchema), swapPeriods);
router.put('/:id/lock', requireRole('school_admin'), validate(lockPeriodsSchema), lockPeriods);
router.put('/:id/status', requireRole('school_admin'), validate(publishTimetableSchema), publishTimetable);
router.delete('/:id', requireRole('school_admin'), deleteTimetable);

// Regeneration
router.post('/:id/regenerate-partial', requireRole('school_admin'), regeneratePartial);

// Exports
router.get('/:id/export/pdf', requireRole('school_admin', 'teacher', 'student', 'parent'), exportToPdf);
router.get('/:id/export/excel', requireRole('school_admin'), exportToExcel);

export default router;
