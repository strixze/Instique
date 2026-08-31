import { Router } from 'express';
import { createSyllabus, getSyllabus, getSyllabusById, updateProgress, deleteSyllabus } from '../controllers/syllabus.controller.js';
import authMiddleware from '../middlewares/auth.middleware.js';
import { requireRole } from '../middlewares/rbac.middleware.js';
import tenantMiddleware from '../middlewares/tenant.middleware.js';
import validate from '../middlewares/validate.middleware.js';
import { createSyllabusSchema, updateProgressSchema } from '../validators/syllabus.validator.js';

const router = Router();

router.use(authMiddleware, tenantMiddleware);

router.get('/', requireRole('school_admin', 'teacher'), getSyllabus);
router.get('/:id', requireRole('school_admin', 'teacher'), getSyllabusById);
router.post('/', requireRole('teacher', 'school_admin'), validate(createSyllabusSchema), createSyllabus);
router.put('/:id/progress', requireRole('teacher'), validate(updateProgressSchema), updateProgress);
router.delete('/:id', requireRole('school_admin'), deleteSyllabus);

export default router;
