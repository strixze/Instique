import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/ApiResponse.js';
import * as notificationService from '../services/notification.service.js';

export const getNotifications = asyncHandler(async (req, res) => {
  const result = await notificationService.getNotifications(req.user._id, req.query);
  res.status(200).json(new ApiResponse(200, result.data, 'Notifications fetched', result.meta));
});

export const markAsRead = asyncHandler(async (req, res) => {
  const notification = await notificationService.markAsRead(req.params.id, req.user._id);
  res.status(200).json(new ApiResponse(200, notification, 'Marked as read'));
});

export const markAllAsRead = asyncHandler(async (req, res) => {
  await notificationService.markAllAsRead(req.user._id);
  res.status(200).json(new ApiResponse(200, null, 'All marked as read'));
});

export const getUnreadCount = asyncHandler(async (req, res) => {
  const count = await notificationService.getUnreadCount(req.user._id);
  res.status(200).json(new ApiResponse(200, { count }));
});

export const sendBulkNotification = asyncHandler(async (req, res) => {
  const { recipientIds, title, message, type } = req.body;
  const result = await notificationService.sendBulkNotification(req.schoolId, recipientIds, title, message, type);
  res.status(201).json(new ApiResponse(201, result, 'Bulk notification sent'));
});
