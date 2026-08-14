import { Router } from 'express';
import { onboardSchool, getSubscriptions, updateSubscription, getPlatformStats, getInstallments, createInstallments } from '../controllers/saas.controller.js';
import authMiddleware from '../middlewares/auth.middleware.js';
import { requireRole } from '../middlewares/rbac.middleware.js';
import validate from '../middlewares/validate.middleware.js';
import { createInstallmentConfigSchema } from '../validators/saas.validator.js';

const router = Router();

router.use(authMiddleware);

router.get('/stats', requireRole('super_admin'), getPlatformStats);
router.get('/subscriptions', requireRole('super_admin'), getSubscriptions);
router.put('/subscriptions/:id', requireRole('super_admin'), updateSubscription);
router.post('/onboard', requireRole('super_admin'), onboardSchool);

router.get('/installments', requireRole('super_admin', 'school_admin'), getInstallments);
router.post('/installments', requireRole('super_admin'), validate(createInstallmentConfigSchema), createInstallments);

export default router;
