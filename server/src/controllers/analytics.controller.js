import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/ApiResponse.js';
import * as analyticsService from '../services/analytics.service.js';

export const getOverview = asyncHandler(async (req, res) => {
  const data = await analyticsService.getExecutiveOverview(req.schoolId, req.query);
  res.status(200).json(new ApiResponse(200, data, 'Executive overview fetched successfully'));
});

export const getStudents = asyncHandler(async (req, res) => {
  const data = await analyticsService.getStudentAnalytics(req.schoolId, req.query);
  res.status(200).json(new ApiResponse(200, data, 'Student analytics fetched successfully'));
});

export const getAttendance = asyncHandler(async (req, res) => {
  const data = await analyticsService.getAttendanceAnalytics(req.schoolId, req.query);
  res.status(200).json(new ApiResponse(200, data, 'Attendance analytics fetched successfully'));
});

export const getAcademics = asyncHandler(async (req, res) => {
  const data = await analyticsService.getAcademicAnalytics(req.schoolId, req.query);
  res.status(200).json(new ApiResponse(200, data, 'Academic performance analytics fetched successfully'));
});

export const getFees = asyncHandler(async (req, res) => {
  const data = await analyticsService.getFeeAnalytics(req.schoolId, req.query);
  res.status(200).json(new ApiResponse(200, data, 'Fee collection analytics fetched successfully'));
});

export const getAdmissions = asyncHandler(async (req, res) => {
  const data = await analyticsService.getAdmissionsAnalytics(req.schoolId, req.query);
  res.status(200).json(new ApiResponse(200, data, 'Admissions analytics fetched successfully'));
});

export const getTeachers = asyncHandler(async (req, res) => {
  const data = await analyticsService.getTeacherAnalytics(req.schoolId, req.query);
  res.status(200).json(new ApiResponse(200, data, 'Teacher analytics fetched successfully'));
});

export const getHomework = asyncHandler(async (req, res) => {
  const data = await analyticsService.getHomeworkAnalytics(req.schoolId, req.query);
  res.status(200).json(new ApiResponse(200, data, 'Homework analytics fetched successfully'));
});

export const getOperations = asyncHandler(async (req, res) => {
  const data = await analyticsService.getOperationsAnalytics(req.schoolId);
  res.status(200).json(new ApiResponse(200, data, 'Operations analytics fetched successfully'));
});

export const getInsights = asyncHandler(async (req, res) => {
  const data = await analyticsService.getDynamicInsights(req.schoolId);
  res.status(200).json(new ApiResponse(200, data, 'Dynamic insights fetched successfully'));
});

export const getRecentActivity = asyncHandler(async (req, res) => {
  const limit = req.query.limit ? parseInt(req.query.limit, 10) : 10;
  const data = await analyticsService.getRecentActivity(req.schoolId, limit);
  res.status(200).json(new ApiResponse(200, data, 'Recent activity fetched successfully'));
});

export const exportReport = asyncHandler(async (req, res) => {
  const overview = await analyticsService.getExecutiveOverview(req.schoolId, req.query);
  const students = await analyticsService.getStudentAnalytics(req.schoolId, req.query);
  const fees = await analyticsService.getFeeAnalytics(req.schoolId, req.query);
  const attendance = await analyticsService.getAttendanceAnalytics(req.schoolId, req.query);

  const report = {
    generatedAt: new Date().toISOString(),
    schoolId: req.schoolId,
    query: req.query,
    overview: overview.kpis,
    studentsSummary: students.summary,
    feeSummary: fees.summary,
    attendanceSummary: attendance.summary,
  };

  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename=instique-analytics-${Date.now()}.json`);
  res.status(200).json(new ApiResponse(200, report, 'Analytics report generated successfully'));
});
