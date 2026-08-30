import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/ApiResponse.js';
import * as leaveService from '../services/leave.service.js';

export const createLeave = asyncHandler(async (req, res) => {
  const leave = await leaveService.createLeave(req.schoolId, req.body, req.user._id);
  res.status(201).json(new ApiResponse(201, leave, 'Leave request submitted'));
});

export const getLeaves = asyncHandler(async (req, res) => {
  const result = await leaveService.getLeaves(req.schoolId, req.query, req.user);
  res.status(200).json(new ApiResponse(200, result.data, 'Leaves fetched', result.meta));
});


export const getLeaveById = asyncHandler(async (req, res) => {
  const leave = await leaveService.getLeaveById(req.params.id, req.schoolId);
  res.status(200).json(new ApiResponse(200, leave));
});

export const processLeave = asyncHandler(async (req, res) => {
  const leave = await leaveService.processLeave(req.params.id, req.schoolId, req.body, req.user._id);
  res.status(200).json(new ApiResponse(200, leave, `Leave ${req.body.status}`));
});

export const getMyLeaves = asyncHandler(async (req, res) => {
  const result = await leaveService.getMyLeaves(req.user._id, req.query);
  res.status(200).json(new ApiResponse(200, result.data, 'Leaves fetched', result.meta));
});
