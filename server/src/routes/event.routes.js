import { Router } from 'express';
import {
  createEvent,
  getEvents,
  getEventById,
  updateEvent,
  publishEvent,
  cancelEvent,
  deleteEvent,
  getCalendar,
  getEventStats,
} from '../controllers/event.controller.js';
import authMiddleware from '../middlewares/auth.middleware.js';
import { requireRole } from '../middlewares/rbac.middleware.js';
import tenantMiddleware from '../middlewares/tenant.middleware.js';

const router = Router();

router.use(authMiddleware, tenantMiddleware);

router.get('/calendar', requireRole('school_admin', 'teacher', 'student', 'parent'), getCalendar);
router.get('/stats', requireRole('school_admin', 'teacher', 'student', 'parent'), getEventStats);
router.get('/', requireRole('school_admin', 'teacher', 'student', 'parent'), getEvents);
router.get('/:id', requireRole('school_admin', 'teacher', 'student', 'parent'), getEventById);
router.post('/', requireRole('school_admin'), createEvent);
router.put('/:id', requireRole('school_admin'), updateEvent);
router.put('/:id/publish', requireRole('school_admin'), publishEvent);
router.put('/:id/cancel', requireRole('school_admin'), cancelEvent);
router.delete('/:id', requireRole('school_admin'), deleteEvent);

export default router;
