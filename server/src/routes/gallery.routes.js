import { Router } from 'express';
import {
  getAlbums,
  createAlbum,
  getAlbumById,
  updateAlbum,
  deleteAlbum,
  uploadPhotos,
  deletePhoto,
  setPhotoAsCover,
  getAlbumByEvent,
} from '../controllers/gallery.controller.js';
import authMiddleware from '../middlewares/auth.middleware.js';
import { requireRole } from '../middlewares/rbac.middleware.js';
import tenantMiddleware from '../middlewares/tenant.middleware.js';
import upload from '../middlewares/upload.middleware.js';

const router = Router();

router.use(authMiddleware, tenantMiddleware);

router.get('/albums', requireRole('school_admin', 'teacher', 'student', 'parent'), getAlbums);
router.post('/albums', requireRole('school_admin'), createAlbum);
router.get('/albums/:id', requireRole('school_admin', 'teacher', 'student', 'parent'), getAlbumById);
router.put('/albums/:id', requireRole('school_admin'), updateAlbum);
router.delete('/albums/:id', requireRole('school_admin'), deleteAlbum);

router.post('/albums/:id/photos', requireRole('school_admin'), upload.array('photos', 30), uploadPhotos);
router.put('/albums/:id/photos/:photoId/cover', requireRole('school_admin'), setPhotoAsCover);
router.delete('/photos/:photoId', requireRole('school_admin'), deletePhoto);

router.get('/event/:eventId', requireRole('school_admin', 'teacher', 'student', 'parent'), getAlbumByEvent);

export default router;
