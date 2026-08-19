import { Router } from 'express';
import {
  createMeeting,
  getMeetings,
  getMeetingStats,
  getMeetingById,
  updateMeeting,
  publishMeeting,
  cancelMeeting,
  recordRSVP,
  markAttendance,
  addOrUpdateNotes,
  exportMeetingReport,
  deleteMeeting,
} from '../controllers/meeting.controller.js';
import authMiddleware from '../middlewares/auth.middleware.js';
import { requireRole } from '../middlewares/rbac.middleware.js';
import tenantMiddleware from '../middlewares/tenant.middleware.js';
import validate from '../middlewares/validate.middleware.js';
import {
  createMeetingSchema,
  updateMeetingSchema,
  rsvpSchema,
  attendanceSchema,
  noteSchema,
} from '../validators/meeting.validator.js';

const router = Router();

router.use(authMiddleware, tenantMiddleware);

router.get('/stats', requireRole('school_admin', 'teacher', 'parent'), getMeetingStats);
router.get('/', requireRole('school_admin', 'teacher', 'parent'), getMeetings);
router.get('/:id', requireRole('school_admin', 'teacher', 'parent'), getMeetingById);
router.get('/:id/export', requireRole('school_admin', 'teacher'), exportMeetingReport);

router.post('/', requireRole('school_admin'), validate(createMeetingSchema), createMeeting);
router.put('/:id', requireRole('school_admin'), validate(updateMeetingSchema), updateMeeting);
router.patch('/:id/publish', requireRole('school_admin'), publishMeeting);
router.patch('/:id/cancel', requireRole('school_admin'), cancelMeeting);

router.post('/:id/rsvp', requireRole('parent'), validate(rsvpSchema), recordRSVP);
router.patch('/:id/attendance', requireRole('school_admin', 'teacher'), validate(attendanceSchema), markAttendance);
router.post('/:id/notes', requireRole('school_admin', 'teacher'), validate(noteSchema), addOrUpdateNotes);

router.delete('/:id', requireRole('school_admin'), deleteMeeting);

export default router;

