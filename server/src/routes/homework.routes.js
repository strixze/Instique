import { Router } from 'express';
import {
  createHomework,
  getHomework,
  getHomeworkById,
  updateHomework,
  deleteHomework,
  submitHomework,
  getTeacherAssignments,
  publishHomework,
  cancelHomework,
} from '../controllers/homework.controller.js';
import authMiddleware from '../middlewares/auth.middleware.js';
import { requireRole } from '../middlewares/rbac.middleware.js';
import tenantMiddleware from '../middlewares/tenant.middleware.js';
import { upload } from '../middlewares/multer.middleware.js';

const router = Router();

router.use(authMiddleware, tenantMiddleware);

// Assignments for Create Form
router.get('/my-assignments', requireRole('teacher', 'school_admin'), getTeacherAssignments);

// Homework Queries
router.get('/', requireRole('school_admin', 'teacher', 'student', 'parent'), getHomework);
router.get('/:id', requireRole('school_admin', 'teacher', 'student', 'parent'), getHomeworkById);

// Homework CRUD
router.post(
  '/',
  requireRole('teacher', 'school_admin'),
  upload.array('attachments', 5),
  createHomework
);

router.put(
  '/:id',
  requireRole('teacher', 'school_admin'),
  upload.array('attachments', 5),
  updateHomework
);

router.patch('/:id/publish', requireRole('teacher', 'school_admin'), publishHomework);
router.patch('/:id/cancel', requireRole('teacher', 'school_admin'), cancelHomework);
router.delete('/:id', requireRole('teacher', 'school_admin'), deleteHomework);

// Student Submission
router.post(
  '/:id/submit',
  requireRole('student'),
  upload.array('attachments', 5),
  submitHomework
);

export default router;
