import { Router } from 'express';
import {
  getSubstitutions,
  getEligibleTeachersForSlot,
  cancelSubstitution,
  getMySubstitutions,
} from '../controllers/substitution.controller.js';
import authMiddleware from '../middlewares/auth.middleware.js';
import { requireRole } from '../middlewares/rbac.middleware.js';
import tenantMiddleware from '../middlewares/tenant.middleware.js';
import validate from '../middlewares/validate.middleware.js';
import { eligibleTeachersQuerySchema, cancelSubstitutionSchema } from '../validators/substitution.validator.js';

const router = Router();

router.use(authMiddleware, tenantMiddleware);

router.get('/my', requireRole('teacher'), getMySubstitutions);
router.get('/', requireRole('school_admin', 'teacher'), getSubstitutions);
router.get('/eligible-teachers', requireRole('school_admin'), validate(eligibleTeachersQuerySchema, 'query'), getEligibleTeachersForSlot);
router.post('/:id/cancel', requireRole('school_admin'), validate(cancelSubstitutionSchema), cancelSubstitution);

export default router;
