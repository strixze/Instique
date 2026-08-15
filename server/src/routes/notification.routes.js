import { Router } from 'express';
import { getNotifications, markAsRead, markAllAsRead, getUnreadCount, sendBulkNotification } from '../controllers/notification.controller.js';
import authMiddleware from '../middlewares/auth.middleware.js';
import { requireRole } from '../middlewares/rbac.middleware.js';
import tenantMiddleware from '../middlewares/tenant.middleware.js';

const router = Router();

router.use(authMiddleware);

router.get('/', getNotifications);
router.get('/unread-count', getUnreadCount);
router.put('/:id/read', markAsRead);
router.put('/read-all', markAllAsRead);
router.post('/bulk', tenantMiddleware, requireRole('school_admin'), sendBulkNotification);

export default router;
