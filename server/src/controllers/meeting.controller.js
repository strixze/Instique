import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/ApiResponse.js';
import * as meetingService from '../services/meeting.service.js';

export const createMeeting = asyncHandler(async (req, res) => {
  const meeting = await meetingService.createMeeting(req.schoolId, req.body, req.user._id);
  res.status(201).json(new ApiResponse(201, meeting, 'Meeting scheduled'));
});

export const getMeetings = asyncHandler(async (req, res) => {
  const result = await meetingService.getMeetings(req.schoolId, req.query);
  res.status(200).json(new ApiResponse(200, result.data, 'Meetings fetched', result.meta));
});

export const getMeetingById = asyncHandler(async (req, res) => {
  const meeting = await meetingService.getMeetingById(req.params.id, req.schoolId);
  res.status(200).json(new ApiResponse(200, meeting));
});

export const updateMeeting = asyncHandler(async (req, res) => {
  const meeting = await meetingService.updateMeeting(req.params.id, req.schoolId, req.body);
  res.status(200).json(new ApiResponse(200, meeting, 'Meeting updated'));
});

export const markAttendance = asyncHandler(async (req, res) => {
  const meeting = await meetingService.markAttendance(req.params.id, req.schoolId, req.body.parentId);
  res.status(200).json(new ApiResponse(200, meeting, 'Attendance marked'));
});

export const deleteMeeting = asyncHandler(async (req, res) => {
  await meetingService.deleteMeeting(req.params.id, req.schoolId);
  res.status(200).json(new ApiResponse(200, null, 'Meeting deleted'));
});
