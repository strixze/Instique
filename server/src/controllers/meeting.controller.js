import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/ApiResponse.js';
import * as meetingService from '../services/meeting.service.js';

export const createMeeting = asyncHandler(async (req, res) => {
  const meeting = await meetingService.createMeeting(req.schoolId, req.body, req.user._id);
  res.status(201).json(new ApiResponse(201, meeting, 'Parent Meeting created successfully'));
});

export const getMeetings = asyncHandler(async (req, res) => {
  const result = await meetingService.getMeetings(req.schoolId, req.query, req.user);
  res.status(200).json(new ApiResponse(200, result.data, 'Meetings fetched successfully', result.meta));
});

export const getMeetingStats = asyncHandler(async (req, res) => {
  const stats = await meetingService.getMeetingStats(req.schoolId, req.user);
  res.status(200).json(new ApiResponse(200, stats, 'Meeting stats fetched successfully'));
});

export const getMeetingById = asyncHandler(async (req, res) => {
  const meeting = await meetingService.getMeetingById(req.params.id, req.schoolId, req.user);
  res.status(200).json(new ApiResponse(200, meeting, 'Meeting details fetched successfully'));
});

export const updateMeeting = asyncHandler(async (req, res) => {
  const meeting = await meetingService.updateMeeting(req.params.id, req.schoolId, req.body, req.user._id);
  res.status(200).json(new ApiResponse(200, meeting, 'Parent Meeting updated successfully'));
});

export const publishMeeting = asyncHandler(async (req, res) => {
  const meeting = await meetingService.publishMeeting(req.params.id, req.schoolId, req.user._id);
  res.status(200).json(new ApiResponse(200, meeting, 'Parent Meeting published successfully'));
});

export const cancelMeeting = asyncHandler(async (req, res) => {
  const meeting = await meetingService.cancelMeeting(req.params.id, req.schoolId);
  res.status(200).json(new ApiResponse(200, meeting, 'Parent Meeting cancelled successfully'));
});

export const recordRSVP = asyncHandler(async (req, res) => {
  const meeting = await meetingService.recordRSVP(req.params.id, req.schoolId, req.user, req.body);
  res.status(200).json(new ApiResponse(200, meeting, 'RSVP recorded successfully'));
});

export const markAttendance = asyncHandler(async (req, res) => {
  const meeting = await meetingService.markAttendance(req.params.id, req.schoolId, req.user, req.body);
  res.status(200).json(new ApiResponse(200, meeting, 'Attendance updated successfully'));
});

export const addOrUpdateNotes = asyncHandler(async (req, res) => {
  const meeting = await meetingService.addOrUpdateNotes(req.params.id, req.schoolId, req.user, req.body);
  res.status(200).json(new ApiResponse(200, meeting, 'Meeting note saved successfully'));
});

export const exportMeetingReport = asyncHandler(async (req, res) => {
  const report = await meetingService.exportMeetingReport(req.params.id, req.schoolId);
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="${report.filename}"`);
  res.status(200).send(report.content);
});

export const deleteMeeting = asyncHandler(async (req, res) => {
  await meetingService.deleteMeeting(req.params.id, req.schoolId);
  res.status(200).json(new ApiResponse(200, null, 'Parent Meeting deleted successfully'));
});

