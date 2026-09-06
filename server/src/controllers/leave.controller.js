import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/ApiResponse.js';
import ApiError from '../utils/ApiError.js';
import Setting from '../models/Setting.js';
import * as leaveService from '../services/leave.service.js';

export const createLeave = asyncHandler(async (req, res) => {
  if (req.user?.role === 'parent') {
    const setting = await Setting.findOne({ schoolId: req.schoolId }).select('visibility').lean();
    if (setting?.visibility?.parent?.leaves === false) {
      throw new ApiError(403, 'Submitting leave applications is currently disabled for parents by school policy');
    }
  }
  const leave = await leaveService.createLeave(req.schoolId, req.body, req.user._id);
  res.status(201).json(new ApiResponse(201, leave, 'Leave request submitted successfully'));
});

export const getLeaves = asyncHandler(async (req, res) => {
  if (req.user?.role === 'parent') {
    const setting = await Setting.findOne({ schoolId: req.schoolId }).select('visibility').lean();
    if (setting?.visibility?.parent?.leaves === false) {
      return res.status(200).json(new ApiResponse(200, [], 'Leaves fetched successfully', { total: 0, page: 1, limit: 10, totalPages: 0 }));
    }
  }
  const result = await leaveService.getLeaves(req.schoolId, req.query, req.user);
  res.status(200).json(new ApiResponse(200, result.data, 'Leaves fetched successfully', result.meta));
});

export const getLeaveById = asyncHandler(async (req, res) => {
  const result = await leaveService.getLeaveById(req.params.id, req.schoolId);
  res.status(200).json(new ApiResponse(200, result));
});

export const getAffectedLectures = asyncHandler(async (req, res) => {
  const result = await leaveService.getAffectedLectures(req.params.id, req.schoolId);
  res.status(200).json(new ApiResponse(200, result, 'Affected lectures calculated'));
});

export const approveLeave = asyncHandler(async (req, res) => {
  const result = await leaveService.approveLeaveWithAssignments(
    req.params.id,
    req.schoolId,
    req.body.assignments,
    req.user._id
  );
  res.status(200).json(new ApiResponse(200, result, 'Leave approved successfully'));
});

export const rejectLeave = asyncHandler(async (req, res) => {
  const result = await leaveService.rejectLeave(
    req.params.id,
    req.schoolId,
    req.body.rejectionReason,
    req.user._id
  );
  res.status(200).json(new ApiResponse(200, result, 'Leave request rejected'));
});

export const cancelLeave = asyncHandler(async (req, res) => {
  const leave = await leaveService.cancelLeave(req.params.id, req.schoolId, req.user._id, req.body?.notes);
  res.status(200).json(new ApiResponse(200, leave, 'Leave request cancelled'));
});

export const getMyLeaves = asyncHandler(async (req, res) => {
  const result = await leaveService.getMyLeaves(req.user._id, req.query);
  res.status(200).json(new ApiResponse(200, result.data, 'Leaves fetched successfully', result.meta));
});
