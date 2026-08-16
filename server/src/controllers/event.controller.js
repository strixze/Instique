import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/ApiResponse.js';
import * as eventService from '../services/event.service.js';

export const createEvent = asyncHandler(async (req, res) => {
  const event = await eventService.createEvent(req.schoolId, req.body, req.user._id);
  res.status(201).json(new ApiResponse(201, event, 'Event created'));
});

export const getEvents = asyncHandler(async (req, res) => {
  const result = await eventService.getEvents(req.schoolId, req.query);
  res.status(200).json(new ApiResponse(200, result.data, 'Events fetched', result.meta));
});

export const getEventById = asyncHandler(async (req, res) => {
  const event = await eventService.getEventById(req.params.id, req.schoolId);
  res.status(200).json(new ApiResponse(200, event));
});

export const updateEvent = asyncHandler(async (req, res) => {
  const event = await eventService.updateEvent(req.params.id, req.schoolId, req.body);
  res.status(200).json(new ApiResponse(200, event, 'Event updated'));
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
  res.status(200).json(new ApiResponse(200, null, 'Event deleted'));
});

export const getCalendar = asyncHandler(async (req, res) => {
  const now = new Date();
  const month = req.query.month ? parseInt(req.query.month) : now.getMonth() + 1;
  const year = req.query.year ? parseInt(req.query.year) : now.getFullYear();
  const events = await eventService.getCalendar(req.schoolId, month, year);
  res.status(200).json(new ApiResponse(200, events));
});

export const getEventStats = asyncHandler(async (req, res) => {
  const stats = await eventService.getEventStats(req.schoolId);
  res.status(200).json(new ApiResponse(200, stats, 'Event stats fetched'));
});
