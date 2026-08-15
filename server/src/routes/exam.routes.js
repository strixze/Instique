import { Router } from 'express';
import { createExam, getExams, getExamById, updateExam, deleteExam, enterMark, getMarks, getMarksByExam, publishResults } from '../controllers/exam.controller.js';
import authMiddleware from '../middlewares/auth.middleware.js';
import { requireRole } from '../middlewares/rbac.middleware.js';
import tenantMiddleware from '../middlewares/tenant.middleware.js';
import validate from '../middlewares/validate.middleware.js';
import { createExamSchema, enterMarkSchema } from '../validators/exam.validator.js';

const router = Router();

router.use(authMiddleware, tenantMiddleware);

router.get('/', requireRole('school_admin', 'teacher', 'student', 'parent'), getExams);
router.get('/:id', requireRole('school_admin', 'teacher', 'student', 'parent'), getExamById);
router.post('/', requireRole('school_admin'), validate(createExamSchema), createExam);
router.put('/:id', requireRole('school_admin'), updateExam);
router.delete('/:id', requireRole('school_admin'), deleteExam);

router.get('/:examId/marks', requireRole('school_admin', 'teacher'), getMarksByExam);
router.post('/marks', requireRole('teacher', 'school_admin'), validate(enterMarkSchema), enterMark);
router.get('/marks/all', requireRole('school_admin', 'teacher', 'student', 'parent'), getMarks);
router.put('/:examId/publish', requireRole('school_admin'), publishResults);

export default router;
