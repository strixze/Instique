import { Router } from 'express';
import { onboardSchool, getSubscriptions, updateSubscription, getPlatformStats } from '../controllers/saas.controller.js';
import authMiddleware from '../middlewares/auth.middleware.js';
import { requireRole } from '../middlewares/rbac.middleware.js';

const router = Router();

router.use(authMiddleware);

router.get('/stats', requireRole('super_admin'), getPlatformStats);
router.get('/subscriptions', requireRole('super_admin'), getSubscriptions);
router.put('/subscriptions/:id', requireRole('super_admin'), updateSubscription);
router.post('/onboard', requireRole('super_admin'), onboardSchool);

export default router;
