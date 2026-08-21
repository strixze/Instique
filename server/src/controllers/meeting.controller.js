import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/ApiResponse.js';
import * as meetingService from '../services/meeting.service.js';

export const createMeeting = asyncHandler(async (req, res) => {
  const meeting = await meetingService.createMeeting(req.schoolId, req.body, req.user._id);
  res.status(201).json(new ApiResponse(201, meeting, 'Meeting draft created'));
});

export const getMeetings = asyncHandler(async (req, res) => {
  const result = await meetingService.getMeetings(req.schoolId, req.query, req.user);
  res.status(200).json(new ApiResponse(200, result.data, 'Meetings fetched', result.meta));
});

export const getMeetingStats = asyncHandler(async (req, res) => {
  const stats = await meetingService.getMeetingStats(req.schoolId, req.user);
  res.status(200).json(new ApiResponse(200, stats, 'Meeting stats fetched'));
});

export const previewMeeting = asyncHandler(async (req, res) => {
  const preview = await meetingService.previewMeeting(req.schoolId, req.body);
  res.status(200).json(new ApiResponse(200, preview, 'Meeting preview fetched'));
});

export const getMeetingById = asyncHandler(async (req, res) => {
  const meeting = await meetingService.getMeetingById(req.params.id, req.schoolId, req.user);
  res.status(200).json(new ApiResponse(200, meeting));
});

export const updateMeeting = asyncHandler(async (req, res) => {
  const meeting = await meetingService.updateMeeting(req.params.id, req.schoolId, req.body, req.user._id);
  res.status(200).json(new ApiResponse(200, meeting, 'Meeting updated'));
});

export const deleteMeeting = asyncHandler(async (req, res) => {
  await meetingService.deleteMeeting(req.params.id, req.schoolId, req.user._id);
  res.status(200).json(new ApiResponse(200, null, 'Meeting deleted'));
});

export const publishMeeting = asyncHandler(async (req, res) => {
  const meeting = await meetingService.publishMeeting(
    req.params.id, req.schoolId, req.user, req.ip, req.get('user-agent')
  );
  res.status(200).json(new ApiResponse(200, meeting, 'Meeting published'));
});

export const cancelMeeting = asyncHandler(async (req, res) => {
  const meeting = await meetingService.cancelMeeting(
    req.params.id, req.schoolId, req.user, req.body?.reason, req.ip, req.get('user-agent')
  );
  res.status(200).json(new ApiResponse(200, meeting, 'Meeting cancelled'));
});

export const completeMeeting = asyncHandler(async (req, res) => {
  const meeting = await meetingService.completeMeeting(
    req.params.id, req.schoolId, req.user, req.ip, req.get('user-agent')
  );
  res.status(200).json(new ApiResponse(200, meeting, 'Meeting completed'));
});

export const rsvpMeeting = asyncHandler(async (req, res) => {
  const result = await meetingService.rsvpMeeting(
    req.params.id, req.schoolId, req.user.profileId, req.body.rsvpStatus
  );
  res.status(200).json(new ApiResponse(200, result, 'Response saved'));
});

export const markAttendance = asyncHandler(async (req, res) => {
  const result = await meetingService.markAttendance(req.params.id, req.schoolId, req.body, req.user);
  res.status(200).json(new ApiResponse(200, result, 'Attendance updated'));
});

export const bulkMarkAttendance = asyncHandler(async (req, res) => {
  const result = await meetingService.bulkMarkAttendance(req.params.id, req.schoolId, req.body.updates, req.user);
  res.status(200).json(new ApiResponse(200, result, 'Attendance updated'));
});

export const addNote = asyncHandler(async (req, res) => {
  const note = await meetingService.addNote(req.params.id, req.schoolId, req.body, req.user);
  res.status(201).json(new ApiResponse(201, note, 'Note added'));
});

export const updateNote = asyncHandler(async (req, res) => {
  const note = await meetingService.updateNote(req.params.noteId, req.params.id, req.schoolId, req.body, req.user);
  res.status(200).json(new ApiResponse(200, note, 'Note updated'));
});

export const deleteNote = asyncHandler(async (req, res) => {
  await meetingService.deleteNote(req.params.noteId, req.params.id, req.schoolId, req.user);
  res.status(200).json(new ApiResponse(200, null, 'Note deleted'));
});

export const getMeetingParticipants = asyncHandler(async (req, res) => {
  const participants = await meetingService.getMeetingParticipants(req.params.id, req.schoolId, req.user);
  res.status(200).json(new ApiResponse(200, participants, 'Participants fetched'));
});