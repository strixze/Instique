import { Router } from 'express';
import {
  createMeeting, getMeetings, getMeetingStats, previewMeeting, getMeetingById,
  updateMeeting, deleteMeeting, publishMeeting, cancelMeeting, completeMeeting,
  rsvpMeeting, markAttendance, bulkMarkAttendance, addNote, updateNote,
  deleteNote, getMeetingParticipants,
} from '../controllers/meeting.controller.js';
import authMiddleware from '../middlewares/auth.middleware.js';
import { requireRole } from '../middlewares/rbac.middleware.js';
import tenantMiddleware from '../middlewares/tenant.middleware.js';
import validate from '../middlewares/validate.middleware.js';
import {
  createMeetingSchema, updateMeetingSchema, cancelMeetingSchema, rsvpSchema,
  attendanceSchema, bulkAttendanceSchema, noteSchema, updateNoteSchema, meetingPreviewSchema,
} from '../validators/meeting.validator.js';

const router = Router();

router.use(authMiddleware, tenantMiddleware);

router.get('/stats', requireRole('school_admin', 'teacher'), getMeetingStats);
router.post('/preview', requireRole('school_admin'), validate(meetingPreviewSchema), previewMeeting);
router.get('/', requireRole('school_admin', 'teacher', 'parent'), getMeetings);
router.post('/', requireRole('school_admin'), validate(createMeetingSchema), createMeeting);
router.get('/:id', requireRole('school_admin', 'teacher', 'parent'), getMeetingById);
router.put('/:id', requireRole('school_admin'), validate(updateMeetingSchema), updateMeeting);
router.delete('/:id', requireRole('school_admin'), deleteMeeting);

router.patch('/:id/publish', requireRole('school_admin'), publishMeeting);
router.patch('/:id/cancel', requireRole('school_admin'), validate(cancelMeetingSchema), cancelMeeting);
router.patch('/:id/complete', requireRole('school_admin'), completeMeeting);
router.post('/:id/rsvp', requireRole('parent'), validate(rsvpSchema), rsvpMeeting);

router.get('/:id/participants', requireRole('school_admin', 'teacher', 'parent'), getMeetingParticipants);
router.patch('/:id/attendance', requireRole('school_admin', 'teacher'), validate(attendanceSchema), markAttendance);
router.patch('/:id/attendance/bulk', requireRole('school_admin', 'teacher'), validate(bulkAttendanceSchema), bulkMarkAttendance);

router.post('/:id/notes', requireRole('school_admin', 'teacher'), validate(noteSchema), addNote);
router.patch('/:id/notes/:noteId', requireRole('school_admin', 'teacher'), validate(updateNoteSchema), updateNote);
router.delete('/:id/notes/:noteId', requireRole('school_admin', 'teacher'), deleteNote);

export default router;