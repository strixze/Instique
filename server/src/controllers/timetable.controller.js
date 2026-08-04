import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/ApiResponse.js';
import * as timetableService from '../services/timetable.service.js';

export const generateTimetable = asyncHandler(async (req, res) => {
  const timetable = await timetableService.generateTimetable(req.schoolId, req.body);
  res.status(201).json(new ApiResponse(201, timetable, 'Timetable generated'));
});

export const getTimetables = asyncHandler(async (req, res) => {
  const result = await timetableService.getTimetables(req.schoolId, req.query);
  res.status(200).json(new ApiResponse(200, result.data, 'Timetables fetched', result.meta));
});

export const getTimetableById = asyncHandler(async (req, res) => {
  const timetable = await timetableService.getTimetableById(req.params.id, req.schoolId);
  res.status(200).json(new ApiResponse(200, timetable));
});

export const getTimetableByClassSection = asyncHandler(async (req, res) => {
  const { classId, sectionId } = req.params;
  const timetable = await timetableService.getTimetableByClassSection(req.schoolId, classId, sectionId);
  res.status(200).json(new ApiResponse(200, timetable));
});

export const updateTimetablePeriods = asyncHandler(async (req, res) => {
  const timetable = await timetableService.updateTimetablePeriods(req.params.id, req.schoolId, req.body.periods);
  res.status(200).json(new ApiResponse(200, timetable, 'Timetable updated'));
});

export const publishTimetable = asyncHandler(async (req, res) => {
  const timetable = await timetableService.publishTimetable(req.params.id, req.schoolId, req.body.status);
  res.status(200).json(new ApiResponse(200, timetable, `Timetable ${req.body.status}`));
});

export const deleteTimetable = asyncHandler(async (req, res) => {
  await timetableService.deleteTimetable(req.params.id, req.schoolId);
  res.status(200).json(new ApiResponse(200, null, 'Timetable deleted'));
});

export const findSubstitutes = asyncHandler(async (req, res) => {
  const { teacherId, periodId } = req.params;
  const candidates = await timetableService.findSubstitutes(req.schoolId, teacherId, periodId);
  res.status(200).json(new ApiResponse(200, candidates));
});
