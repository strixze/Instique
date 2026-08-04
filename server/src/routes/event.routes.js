import { Router } from 'express';
import { createEvent, getEvents, getEventById, updateEvent, deleteEvent, getCalendar } from '../controllers/event.controller.js';
import authMiddleware from '../middlewares/auth.middleware.js';
import { requireRole } from '../middlewares/rbac.middleware.js';
import tenantMiddleware from '../middlewares/tenant.middleware.js';
import validate from '../middlewares/validate.middleware.js';
import { createEventSchema } from '../validators/event.validator.js';

const router = Router();

router.use(authMiddleware, tenantMiddleware);

router.get('/calendar', requireRole('school_admin', 'teacher', 'student', 'parent'), getCalendar);
router.get('/', requireRole('school_admin', 'teacher', 'student', 'parent'), getEvents);
router.get('/:id', requireRole('school_admin', 'teacher', 'student', 'parent'), getEventById);
router.post('/', requireRole('school_admin'), validate(createEventSchema), createEvent);
router.put('/:id', requireRole('school_admin'), updateEvent);
router.delete('/:id', requireRole('school_admin'), deleteEvent);

export default router;
