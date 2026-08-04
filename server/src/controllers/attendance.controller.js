import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/ApiResponse.js';
import * as attendanceService from '../services/attendance.service.js';

export const markAttendance = asyncHandler(async (req, res) => {
  const attendance = await attendanceService.markAttendance(req.schoolId, req.body, req.user._id);
  res.status(201).json(new ApiResponse(201, attendance, 'Attendance marked'));
});

export const markAllPresent = asyncHandler(async (req, res) => {
  const attendance = await attendanceService.markAllPresent(req.schoolId, req.body, req.user._id);
  res.status(201).json(new ApiResponse(201, attendance, 'Attendance marked'));
});

export const getAttendance = asyncHandler(async (req, res) => {
  const result = await attendanceService.getAttendance(req.schoolId, req.query);
  res.status(200).json(new ApiResponse(200, result.data, 'Attendance fetched', result.meta));
});

export const getStudentAttendance = asyncHandler(async (req, res) => {
  const result = await attendanceService.getStudentAttendance(req.schoolId, req.params.studentId, req.query);
  res.status(200).json(new ApiResponse(200, result.data, 'Attendance fetched', result.meta));
});

export const getAttendanceReport = asyncHandler(async (req, res) => {
  const { classId, startDate, endDate } = req.query;
  const report = await attendanceService.getAttendanceReport(req.schoolId, classId, startDate, endDate);
  res.status(200).json(new ApiResponse(200, report));
});
