import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/ApiResponse.js';
import * as parentService from '../services/parent.service.js';

export const createParent = asyncHandler(async (req, res) => {
  const parent = await parentService.createParent(req.schoolId, req.body);
  res.status(201).json(new ApiResponse(201, parent, 'Parent created'));
});

export const getParents = asyncHandler(async (req, res) => {
  const result = await parentService.getParents(req.schoolId, req.query);
  res.status(200).json(new ApiResponse(200, result.data, 'Parents fetched', result.meta));
});

export const getParentById = asyncHandler(async (req, res) => {
  const parent = await parentService.getParentById(req.params.id, req.schoolId);
  res.status(200).json(new ApiResponse(200, parent));
});

export const updateParent = asyncHandler(async (req, res) => {
  const parent = await parentService.updateParent(req.params.id, req.schoolId, req.body);
  res.status(200).json(new ApiResponse(200, parent, 'Parent updated'));
});

export const resendActivationEmail = asyncHandler(async (req, res) => {
  const ip = req.ip;
  const userAgent = req.headers['user-agent'] || '';
  const result = await parentService.resendParentActivationEmail(req.params.id, req.schoolId, req.user._id, ip, userAgent);
  res.status(200).json(new ApiResponse(200, result, result.message));
});

export const getMyChildren = asyncHandler(async (req, res) => {
  const result = await parentService.getMyChildren(req.user, req.schoolId);
  res.status(200).json(new ApiResponse(200, result.children, 'Children fetched successfully', { parent: result.parent }));
});

export const getChildDashboard = asyncHandler(async (req, res) => {
  const { studentId } = req.params;
  const data = await parentService.getChildDashboard(studentId, req.user, req.schoolId);
  res.status(200).json(new ApiResponse(200, data, 'Child dashboard data fetched successfully'));
});


