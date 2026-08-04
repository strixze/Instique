import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/ApiResponse.js';
import * as dashboardService from '../services/dashboard.service.js';

export const getSuperAdminDashboard = asyncHandler(async (req, res) => {
  const data = await dashboardService.getSuperAdminDashboard();
  res.status(200).json(new ApiResponse(200, data));
});

export const getSchoolAdminDashboard = asyncHandler(async (req, res) => {
  const data = await dashboardService.getSchoolAdminDashboard(req.schoolId);
  res.status(200).json(new ApiResponse(200, data));
});

export const getTeacherDashboard = asyncHandler(async (req, res) => {
  const data = await dashboardService.getTeacherDashboard(req.user._id, req.schoolId);
  res.status(200).json(new ApiResponse(200, data));
});

export const getStudentDashboard = asyncHandler(async (req, res) => {
  const data = await dashboardService.getStudentDashboard(req.user._id, req.schoolId);
  res.status(200).json(new ApiResponse(200, data));
});

export const getParentDashboard = asyncHandler(async (req, res) => {
  const data = await dashboardService.getParentDashboard(req.user._id, req.schoolId);
  res.status(200).json(new ApiResponse(200, data));
});
