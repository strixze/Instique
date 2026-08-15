import { Router } from 'express';
import { awardPoints, getRecognitionHistory, getLeaderboard, createBadge, getBadges, awardBadge } from '../controllers/recognition.controller.js';
import authMiddleware from '../middlewares/auth.middleware.js';
import { requireRole } from '../middlewares/rbac.middleware.js';
import tenantMiddleware from '../middlewares/tenant.middleware.js';
import validate from '../middlewares/validate.middleware.js';
import { awardPointsSchema, createBadgeSchema, awardBadgeSchema } from '../validators/recognition.validator.js';

const router = Router();

router.use(authMiddleware, tenantMiddleware);

router.get('/leaderboard', requireRole('school_admin', 'teacher', 'student', 'parent'), getLeaderboard);
router.get('/badges', requireRole('school_admin', 'teacher', 'student', 'parent'), getBadges);
router.post('/points', requireRole('teacher', 'school_admin'), validate(awardPointsSchema), awardPoints);
router.get('/history/:studentId', requireRole('teacher', 'school_admin', 'parent', 'student'), getRecognitionHistory);
router.post('/badges', requireRole('school_admin'), validate(createBadgeSchema), createBadge);
router.post('/badges/:badgeId/award', requireRole('school_admin', 'teacher'), validate(awardBadgeSchema), awardBadge);

export default router;
