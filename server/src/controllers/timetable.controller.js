import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/ApiResponse.js';
import * as timetableService from '../services/timetable.service.js';

export const generateTimetable = asyncHandler(async (req, res) => {
  const result = await timetableService.generateTimetable(req.schoolId, req.body);
  res.status(201).json(new ApiResponse(201, result, 'Timetable generated'));
});

export const generateBulkTimetables = asyncHandler(async (req, res) => {
  const results = await timetableService.generateBulkTimetables(req.schoolId, req.body);
  res.status(201).json(new ApiResponse(201, results, 'Bulk timetables generation completed'));
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
  const result = await timetableService.updateTimetablePeriods(req.params.id, req.schoolId, req.body.periods);
  res.status(200).json(new ApiResponse(200, result, 'Timetable periods updated'));
});

export const manualEdit = asyncHandler(async (req, res) => {
  const result = await timetableService.manualEdit(req.params.id, req.schoolId, req.body);
  res.status(200).json(new ApiResponse(200, result, 'Period slot updated'));
});

export const swapPeriods = asyncHandler(async (req, res) => {
  const result = await timetableService.swapPeriods(req.params.id, req.schoolId, req.body);
  res.status(200).json(new ApiResponse(200, result, 'Periods swapped successfully'));
});

export const lockPeriods = asyncHandler(async (req, res) => {
  const timetable = await timetableService.lockPeriods(req.params.id, req.schoolId, req.body);
  res.status(200).json(new ApiResponse(200, timetable, 'Periods locked state updated'));
});

export const regeneratePartial = asyncHandler(async (req, res) => {
  const result = await timetableService.regeneratePartial(req.params.id, req.schoolId);
  res.status(200).json(new ApiResponse(200, result, 'Timetable regenerated partially'));
});

export const publishTimetable = asyncHandler(async (req, res) => {
  const timetable = await timetableService.publishTimetable(req.params.id, req.schoolId, req.body.status);
  res.status(200).json(new ApiResponse(200, timetable, `Timetable status updated to ${req.body.status}`));
});

export const publishClassTimetables = asyncHandler(async (req, res) => {
  const { classId } = req.params;
  const { academicYear, status } = req.body;
  const result = await timetableService.publishClassTimetables(req.schoolId, classId, academicYear, status);
  res.status(200).json(new ApiResponse(200, result, `Updated ${result.updatedCount} timetable(s) to ${status} status`));
});

export const publishSchoolTimetables = asyncHandler(async (req, res) => {
  const { academicYear, status } = req.body;
  const result = await timetableService.publishSchoolTimetables(req.schoolId, academicYear, status);
  res.status(200).json(new ApiResponse(200, result, `Updated ${result.updatedCount} timetable(s) to ${status} status`));
});


export const deleteTimetable = asyncHandler(async (req, res) => {
  await timetableService.deleteTimetable(req.params.id, req.schoolId);
  res.status(200).json(new ApiResponse(200, null, 'Timetable deleted'));
});

export const deleteClassTimetables = asyncHandler(async (req, res) => {
  const { classId } = req.params;
  const { academicYear } = req.query;
  const result = await timetableService.deleteClassTimetables(req.schoolId, classId, academicYear);
  res.status(200).json(new ApiResponse(200, result, `Deleted ${result.deletedCount} timetable(s) for class`));
});

export const deleteSchoolTimetables = asyncHandler(async (req, res) => {
  const { academicYear } = req.query;
  const result = await timetableService.deleteSchoolTimetables(req.schoolId, academicYear);
  res.status(200).json(new ApiResponse(200, result, `Deleted ${result.deletedCount} timetable(s) for school`));
});

export const getTeacherTimetable = asyncHandler(async (req, res) => {
  const schedule = await timetableService.getTeacherTimetable(req.schoolId, req.params.teacherId);
  res.status(200).json(new ApiResponse(200, schedule, 'Teacher timetable schedule fetched'));
});

export const getSubjectTimetable = asyncHandler(async (req, res) => {
  const schedule = await timetableService.getSubjectTimetable(req.schoolId, req.params.subjectId);
  res.status(200).json(new ApiResponse(200, schedule, 'Subject timetable schedule fetched'));
});

export const getDailyView = asyncHandler(async (req, res) => {
  const schedule = await timetableService.getDailyView(req.schoolId, req.params.day);
  res.status(200).json(new ApiResponse(200, schedule, 'Daily timetables view fetched'));
});

export const getConflictReport = asyncHandler(async (req, res) => {
  const conflicts = await timetableService.getConflictReport(req.params.id, req.schoolId);
  res.status(200).json(new ApiResponse(200, conflicts, 'Conflict report fetched'));
});

export const getTeacherWorkloadReport = asyncHandler(async (req, res) => {
  const { academicYear } = req.query;
  const workload = await timetableService.getTeacherWorkloadReport(req.schoolId, academicYear);
  res.status(200).json(new ApiResponse(200, workload, 'Teacher workload report fetched'));
});

export const getSubjectDistributionReport = asyncHandler(async (req, res) => {
  const { academicYear } = req.query;
  const distribution = await timetableService.getSubjectDistributionReport(req.schoolId, academicYear);
  res.status(200).json(new ApiResponse(200, distribution, 'Subject distribution report fetched'));
});

export const exportToPdf = asyncHandler(async (req, res) => {
  const buffer = await timetableService.exportToPdf(req.params.id, req.schoolId);
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'attachment; filename=timetable.pdf');
  res.send(buffer);
});

export const exportToExcel = asyncHandler(async (req, res) => {
  const buffer = await timetableService.exportToExcel(req.params.id, req.schoolId);
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename=timetable.xlsx');
  res.send(buffer);
});

export const findSubstitutes = asyncHandler(async (req, res) => {
  const { teacherId, periodId } = req.params;
  const candidates = await timetableService.findSubstitutes(req.schoolId, teacherId, periodId);
  res.status(200).json(new ApiResponse(200, candidates));
});
