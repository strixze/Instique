import { Router } from 'express';
import { 
  createParent, 
  getParents, 
  getParentById, 
  updateParent, 
  resendActivationEmail,
  getMyChildren,
  getChildDashboard
} from '../controllers/parent.controller.js';
import authMiddleware from '../middlewares/auth.middleware.js';
import { requireRole } from '../middlewares/rbac.middleware.js';
import tenantMiddleware from '../middlewares/tenant.middleware.js';
import { authLimiter } from '../middlewares/rateLimiter.middleware.js';

const router = Router();

router.use(authMiddleware, tenantMiddleware);

// Parent specific routes
router.get('/my-children', requireRole('parent'), getMyChildren);
router.get('/children', requireRole('parent'), getMyChildren);
router.get('/children/:studentId/dashboard', requireRole('parent'), getChildDashboard);

// Administrative / general routes
router.get('/', requireRole('school_admin', 'teacher'), getParents);
router.get('/:id', requireRole('school_admin', 'teacher', 'parent'), getParentById);
router.post('/', requireRole('school_admin'), createParent);
router.put('/:id', requireRole('school_admin'), updateParent);
router.post('/:id/resend-activation', requireRole('school_admin'), authLimiter, resendActivationEmail);

export default router;


