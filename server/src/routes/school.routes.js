import { Router } from 'express';
import { createSchool, getSchools, getSchoolById, updateSchool, deleteSchool, getMySchool } from '../controllers/school.controller.js';
import authMiddleware from '../middlewares/auth.middleware.js';
import { requireRole } from '../middlewares/rbac.middleware.js';
import tenantMiddleware from '../middlewares/tenant.middleware.js';
import validate from '../middlewares/validate.middleware.js';
import { createSchoolSchema, updateSchoolSchema } from '../validators/school.validator.js';

const router = Router();

router.use(authMiddleware);

router.get('/my', tenantMiddleware, getMySchool);
router.get('/', requireRole('super_admin'), getSchools);
router.get('/:id', requireRole('super_admin', 'school_admin'), getSchoolById);
router.post('/', requireRole('super_admin'), validate(createSchoolSchema), createSchool);
router.put('/:id', requireRole('super_admin', 'school_admin'), validate(updateSchoolSchema), updateSchool);
router.delete('/:id', requireRole('super_admin'), deleteSchool);

export default router;
