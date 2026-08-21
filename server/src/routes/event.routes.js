import { Router } from 'express';
import {
  createEvent,
  getEvents,
  getEventById,
  updateEvent,
  deleteEvent,
  getCalendar,
  uploadEventPhotos,
  getEventPhotos,
  deleteEventPhoto,
  updatePhotoCaption,
  setEventCoverPhoto,
} from '../controllers/event.controller.js';
import authMiddleware from '../middlewares/auth.middleware.js';
import { requireRole } from '../middlewares/rbac.middleware.js';
import tenantMiddleware from '../middlewares/tenant.middleware.js';
import validate from '../middlewares/validate.middleware.js';
import { upload } from '../middlewares/multer.middleware.js';
import {
  createEventSchema,
  updateEventSchema,
  updatePhotoCaptionSchema,
} from '../validators/event.validator.js';

const router = Router();

router.use(authMiddleware, tenantMiddleware);

// Calendar & List Queries
router.get('/calendar', requireRole('school_admin', 'teacher', 'student', 'parent'), getCalendar);
router.get('/stats', requireRole('school_admin', 'teacher', 'student', 'parent'), getEventStats);
router.get('/', requireRole('school_admin', 'teacher', 'student', 'parent'), getEvents);

// Event CRUD
router.post('/', requireRole('school_admin'), validate(createEventSchema), createEvent);
router.get('/:id', requireRole('school_admin', 'teacher', 'student', 'parent'), getEventById);
router.put('/:id', requireRole('school_admin'), validate(updateEventSchema), updateEvent);
router.delete('/:id', requireRole('school_admin'), deleteEvent);

// Event Gallery Photo Endpoints
router.get('/:id/photos', requireRole('school_admin', 'teacher', 'student', 'parent'), getEventPhotos);
router.post(
  '/:id/photos',
  requireRole('school_admin', 'teacher'),
  upload.array('photos', 20),
  uploadEventPhotos
);
router.put(
  '/:id/photos/:photoId',
  requireRole('school_admin', 'teacher'),
  validate(updatePhotoCaptionSchema),
  updatePhotoCaption
);
router.put(
  '/:id/photos/:photoId/cover',
  requireRole('school_admin'),
  setEventCoverPhoto
);
router.delete(
  '/:id/photos/:photoId',
  requireRole('school_admin'),
  deleteEventPhoto
);

export default router;
