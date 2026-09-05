import { Router } from 'express';
import {
  createSyllabus,
  getSyllabus,
  getSyllabusById,
  updateSyllabus,
  publishSyllabus,
  archiveSyllabus,
  deleteSyllabus,
  assignSections,
  getTrackById,
  updateTopicProgress,
  getSyllabusAnalytics,
  getTeacherSyllabus,
  getParentChildSyllabus,
} from '../controllers/syllabus.controller.js';
import authMiddleware from '../middlewares/auth.middleware.js';
import { requireRole } from '../middlewares/rbac.middleware.js';
import tenantMiddleware from '../middlewares/tenant.middleware.js';
import validate from '../middlewares/validate.middleware.js';
import {
  createSyllabusSchema,
  updateSyllabusSchema,
  assignSectionsSchema,
  updateTopicProgressSchema,
} from '../validators/syllabus.validator.js';

const router = Router();

router.use(authMiddleware, tenantMiddleware);

// Overview Analytics
router.get('/analytics/overview', requireRole('school_admin'), getSyllabusAnalytics);

// Role specific tracks
router.get('/teacher/me', requireRole('teacher', 'school_admin'), getTeacherSyllabus);
router.get('/parent/child/:studentId', requireRole('parent', 'school_admin'), getParentChildSyllabus);

// Section Tracks & Topic Progress
router.get('/tracks/:trackId', requireRole('school_admin', 'teacher', 'parent', 'student'), getTrackById);
router.patch(
  '/tracks/:trackId/topics/:topicId/progress',
  requireRole('teacher', 'school_admin'),
  validate(updateTopicProgressSchema),
  updateTopicProgress
);

// Syllabus Definitions CRUD & Actions
router.get('/', requireRole('school_admin', 'teacher'), getSyllabus);
router.post('/', requireRole('school_admin'), validate(createSyllabusSchema), createSyllabus);
router.get('/:id', requireRole('school_admin', 'teacher'), getSyllabusById);
router.put('/:id', requireRole('school_admin'), validate(updateSyllabusSchema), updateSyllabus);
router.post('/:id/publish', requireRole('school_admin'), publishSyllabus);
router.post('/:id/archive', requireRole('school_admin'), archiveSyllabus);
router.post('/:id/assign-sections', requireRole('school_admin'), validate(assignSectionsSchema), assignSections);
router.delete('/:id', requireRole('school_admin'), deleteSyllabus);

export default router;
