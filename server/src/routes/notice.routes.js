import { Router } from 'express';
import { createNotice, getNotices, getNoticeById, updateNotice, deleteNotice } from '../controllers/notice.controller.js';
import authMiddleware from '../middlewares/auth.middleware.js';
import { requireRole } from '../middlewares/rbac.middleware.js';
import tenantMiddleware from '../middlewares/tenant.middleware.js';
import validate from '../middlewares/validate.middleware.js';
import { createNoticeSchema } from '../validators/notice.validator.js';

const router = Router();

router.use(authMiddleware, tenantMiddleware);

router.get('/', requireRole('school_admin', 'teacher', 'student', 'parent'), getNotices);
router.get('/:id', requireRole('school_admin', 'teacher', 'student', 'parent'), getNoticeById);
router.post('/', requireRole('school_admin'), validate(createNoticeSchema), createNotice);
router.put('/:id', requireRole('school_admin'), updateNotice);
router.delete('/:id', requireRole('school_admin'), deleteNotice);

export default router;
