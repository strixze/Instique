import { Router } from 'express';
import { createMeeting, getMeetings, getMeetingById, updateMeeting, markAttendance, deleteMeeting } from '../controllers/meeting.controller.js';
import authMiddleware from '../middlewares/auth.middleware.js';
import { requireRole } from '../middlewares/rbac.middleware.js';
import tenantMiddleware from '../middlewares/tenant.middleware.js';
import validate from '../middlewares/validate.middleware.js';
import { createMeetingSchema } from '../validators/meeting.validator.js';

const router = Router();

router.use(authMiddleware, tenantMiddleware);

router.get('/', requireRole('school_admin', 'teacher'), getMeetings);
router.get('/:id', requireRole('school_admin', 'teacher', 'parent'), getMeetingById);
router.post('/', requireRole('school_admin'), validate(createMeetingSchema), createMeeting);
router.put('/:id', requireRole('school_admin'), updateMeeting);
router.put('/:id/attendance', requireRole('school_admin'), markAttendance);
router.delete('/:id', requireRole('school_admin'), deleteMeeting);

export default router;
