import Notification from '../models/Notification.js';
import Setting from '../models/Setting.js';
import { paginate } from '../utils/pagination.js';

/**
 * Check whether a notification for an event is enabled for the target role
 */
export const isNotificationAllowed = async (schoolId, eventKey, role) => {
  if (!schoolId || !eventKey || !role) return true;
  try {
    const setting = await Setting.findOne({ schoolId }).select('notifications');
    if (!setting?.notifications?.rules) return true;
    const rule = setting.notifications.rules[eventKey];
    if (!rule) return true;
    return rule[role] !== false;
  } catch {
    return true;
  }
};

export const createNotification = async (schoolId, data) => {
  if (schoolId && data.eventKey && data.recipientRole) {
    const allowed = await isNotificationAllowed(schoolId, data.eventKey, data.recipientRole);
    if (!allowed) {
      return null; // Suppressed by school notification settings
    }
  }

  const notification = await Notification.create({ ...data, schoolId });

  try {
    const io = getIO();
    io.to(`user:${data.recipient}`).emit('notification', notification);
    if (schoolId) {
      io.to(`school:${schoolId}`).emit('notification', notification);
    }
  } catch {
    // socket not initialized
  }

  return notification;
};

export const getNotifications = async (userId, options) => {
  return paginate(Notification, { recipient: userId }, { ...options, sort: '-createdAt' });
};

export const markAsRead = async (notificationId, userId) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: notificationId, recipient: userId },
    { isRead: true, readAt: new Date() },
    { new: true }
  );
  return notification;
};

export const markAllAsRead = async (userId) => {
  await Notification.updateMany(
    { recipient: userId, isRead: false },
    { isRead: true, readAt: new Date() }
  );
  return true;
};

export const getUnreadCount = async (userId) => {
  return Notification.countDocuments({ recipient: userId, isRead: false });
};

export const sendBulkNotification = async (schoolId, recipientIds, title, message, type = 'bulk') => {
  const notifications = recipientIds.map((recipient) => ({
    schoolId,
    recipient,
    type,
    title,
    message,
  }));

  const created = await Notification.insertMany(notifications);

  try {
    const io = getIO();
    for (const n of created) {
      io.to(`user:${n.recipient}`).emit('notification', n);
    }
  } catch {
    // socket not initialized
  }

  return created;
};
