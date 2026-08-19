import { Router } from 'express';
import {
  createComplaint,
  getComplaints,
  getComplaintById,
  processComplaint,
  getComplaintStats,
} from '../controllers/complaint.controller.js';
import authMiddleware from '../middlewares/auth.middleware.js';
import { requireRole } from '../middlewares/rbac.middleware.js';
import tenantMiddleware from '../middlewares/tenant.middleware.js';
import validate from '../middlewares/validate.middleware.js';
import { createComplaintSchema, processComplaintSchema } from '../validators/complaint.validator.js';

const router = Router();

router.use(authMiddleware, tenantMiddleware);

router.get('/stats', requireRole('school_admin', 'teacher', 'student', 'parent'), getComplaintStats);
router.get('/', requireRole('school_admin', 'teacher', 'student', 'parent'), getComplaints);
router.get('/:id', requireRole('school_admin', 'teacher', 'student', 'parent'), getComplaintById);
router.post('/', requireRole('school_admin', 'teacher', 'student', 'parent'), validate(createComplaintSchema), createComplaint);
router.put('/:id/process', requireRole('school_admin', 'teacher'), validate(processComplaintSchema), processComplaint);

export default router;
