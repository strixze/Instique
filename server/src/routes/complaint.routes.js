import { Router } from 'express';
import { createComplaint, getComplaints, getComplaintById, processComplaint } from '../controllers/complaint.controller.js';
import authMiddleware from '../middlewares/auth.middleware.js';
import { requireRole } from '../middlewares/rbac.middleware.js';
import tenantMiddleware from '../middlewares/tenant.middleware.js';
import validate from '../middlewares/validate.middleware.js';
import { createComplaintSchema, processComplaintSchema } from '../validators/complaint.validator.js';

const router = Router();

router.use(authMiddleware, tenantMiddleware);

router.get('/', requireRole('school_admin'), getComplaints);
router.get('/:id', requireRole('school_admin'), getComplaintById);
router.post('/', requireRole('student', 'parent'), validate(createComplaintSchema), createComplaint);
router.put('/:id/process', requireRole('school_admin'), validate(processComplaintSchema), processComplaint);

export default router;
