import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/ApiResponse.js';
import * as eventService from '../services/event.service.js';

export const createEvent = asyncHandler(async (req, res) => {
  const event = await eventService.createEvent(req.schoolId, req.body, req.user._id);
  res.status(201).json(new ApiResponse(201, event, 'Event created successfully'));
});

export const getEvents = asyncHandler(async (req, res) => {
  const result = await eventService.getEvents(req.schoolId, req.query);
  res.status(200).json(new ApiResponse(200, result.data, 'Events fetched successfully', result.meta));
});

export const getEventById = asyncHandler(async (req, res) => {
  const event = await eventService.getEventById(req.params.id, req.schoolId);
  res.status(200).json(new ApiResponse(200, event, 'Event details fetched'));
});

export const updateEvent = asyncHandler(async (req, res) => {
  const event = await eventService.updateEvent(req.params.id, req.schoolId, req.body);
  res.status(200).json(new ApiResponse(200, event, 'Event updated successfully'));
});

export const publishEvent = asyncHandler(async (req, res) => {
  const event = await eventService.publishEvent(req.params.id, req.schoolId);
  res.status(200).json(new ApiResponse(200, event, 'Event published'));
});

export const cancelEvent = asyncHandler(async (req, res) => {
  const event = await eventService.cancelEvent(req.params.id, req.schoolId);
  res.status(200).json(new ApiResponse(200, event, 'Event cancelled'));
});

export const deleteEvent = asyncHandler(async (req, res) => {
  await eventService.deleteEvent(req.params.id, req.schoolId);
  res.status(200).json(new ApiResponse(200, null, 'Event and all gallery photos deleted successfully'));
});

export const getCalendar = asyncHandler(async (req, res) => {
  const { month, year } = req.query;
  const events = await eventService.getCalendar(
    req.schoolId,
    month ? parseInt(month, 10) : undefined,
    year ? parseInt(year, 10) : undefined
  );
  res.status(200).json(new ApiResponse(200, events, 'Calendar events fetched'));
});

// ==========================================
// EVENT GALLERY PHOTO CONTROLLERS
// ==========================================

export const uploadEventPhotos = asyncHandler(async (req, res) => {
  const files = req.files || (req.file ? [req.file] : []);
  const result = await eventService.uploadEventPhotos(req.schoolId, req.params.id, files, req.user._id);
  res.status(201).json(new ApiResponse(201, result, 'Photos uploaded to gallery successfully'));
});

export const getEventPhotos = asyncHandler(async (req, res) => {
  const result = await eventService.getEventPhotos(req.schoolId, req.params.id, req.query);
  res.status(200).json(new ApiResponse(200, result.data, 'Gallery photos fetched', result.meta));
});

export const deleteEventPhoto = asyncHandler(async (req, res) => {
  await eventService.deleteEventPhoto(req.schoolId, req.params.id, req.params.photoId);
  res.status(200).json(new ApiResponse(200, null, 'Gallery photo deleted successfully'));
});

export const updatePhotoCaption = asyncHandler(async (req, res) => {
  const { caption } = req.body;
  const photo = await eventService.updatePhotoCaption(req.schoolId, req.params.id, req.params.photoId, caption);
  res.status(200).json(new ApiResponse(200, photo, 'Photo caption updated'));
});

export const setEventCoverPhoto = asyncHandler(async (req, res) => {
  const event = await eventService.setEventCoverPhoto(req.schoolId, req.params.id, req.params.photoId);
  res.status(200).json(new ApiResponse(200, event, 'Cover photo updated'));
});

export const getEventStats = asyncHandler(async (req, res) => {
  const stats = await eventService.getEventStats(req.schoolId);
  res.status(200).json(new ApiResponse(200, stats, 'Event stats fetched'));
});
