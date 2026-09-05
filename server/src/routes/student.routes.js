import {
  createStudent,
  getStudents,
  getStudentById,
  getStudentProfile,
  updateStudent,
  deleteStudent,
  bulkCreateStudents,
  promoteStudents,
  sendParentPasswordReset,
} from '../controllers/student.controller.js';
import authMiddleware from '../middlewares/auth.middleware.js';
import { requireRole } from '../middlewares/rbac.middleware.js';
import tenantMiddleware from '../middlewares/tenant.middleware.js';
import validate from '../middlewares/validate.middleware.js';
import { createStudentSchema, updateStudentSchema } from '../validators/student.validator.js';
import Router from "express"

const router = Router();

router.use(authMiddleware, tenantMiddleware);

router.get('/', requireRole('school_admin', 'teacher'), getStudents);
router.get('/:id/profile', requireRole('school_admin', 'teacher', 'parent', 'student'), getStudentProfile);
router.get('/:id', requireRole('school_admin', 'teacher', 'parent'), getStudentById);
router.post('/', requireRole('school_admin'), validate(createStudentSchema), createStudent);
router.put('/:id', requireRole('school_admin'), validate(updateStudentSchema), updateStudent);
router.delete('/:id', requireRole('school_admin'), deleteStudent);
router.post('/bulk', requireRole('school_admin'), bulkCreateStudents);
router.post('/promote', requireRole('school_admin'), promoteStudents);
router.post('/:id/parent/reset-password', requireRole('school_admin'), sendParentPasswordReset);


export default router;
