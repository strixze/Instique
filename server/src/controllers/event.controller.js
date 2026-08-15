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

export const deleteEvent = asyncHandler(async (req, res) => {
  await eventService.deleteEvent(req.params.id, req.schoolId);
  res.status(200).json(new ApiResponse(200, null, 'Event deleted'));
});

export const getCalendar = asyncHandler(async (req, res) => {
  const { month, year } = req.query;
  const events = await eventService.getCalendar(req.schoolId, parseInt(month), parseInt(year));
  res.status(200).json(new ApiResponse(200, events));
});
