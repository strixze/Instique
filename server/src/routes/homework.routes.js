import { Router } from 'express';
import { createHomework, getHomework, getHomeworkById, updateHomework, deleteHomework, submitHomework } from '../controllers/homework.controller.js';
import authMiddleware from '../middlewares/auth.middleware.js';
import { requireRole } from '../middlewares/rbac.middleware.js';
import tenantMiddleware from '../middlewares/tenant.middleware.js';
import validate from '../middlewares/validate.middleware.js';
import { createHomeworkSchema, submitHomeworkSchema } from '../validators/homework.validator.js';

const router = Router();

router.use(authMiddleware, tenantMiddleware);

router.get('/', requireRole('teacher', 'student', 'parent'), getHomework);
router.get('/:id', requireRole('teacher', 'student', 'parent'), getHomeworkById);
router.post('/', requireRole('teacher', 'school_admin'), validate(createHomeworkSchema), createHomework);
router.put('/:id', requireRole('teacher', 'school_admin'), updateHomework);
router.delete('/:id', requireRole('teacher', 'school_admin'), deleteHomework);
router.post('/:id/submit', requireRole('student'), validate(submitHomeworkSchema), submitHomework);

export default router;
