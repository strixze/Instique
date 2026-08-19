import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/ApiResponse.js';
import * as complaintService from '../services/complaint.service.js';

export const createComplaint = asyncHandler(async (req, res) => {
  const complaint = await complaintService.createComplaint(req.schoolId, req.body, req.user);
  res.status(201).json(new ApiResponse(201, complaint, 'Complaint submitted successfully'));
});

export const getComplaints = asyncHandler(async (req, res) => {
  const result = await complaintService.getComplaints(req.schoolId, req.user, req.query);
  res.status(200).json(new ApiResponse(200, result.data, 'Complaints fetched', result.meta));
});

export const getComplaintById = asyncHandler(async (req, res) => {
  const complaint = await complaintService.getComplaintById(req.params.id, req.schoolId);
  res.status(200).json(new ApiResponse(200, complaint));
});

export const processComplaint = asyncHandler(async (req, res) => {
  const complaint = await complaintService.processComplaint(
    req.params.id,
    req.schoolId,
    req.body,
    req.user._id,
    req.user.name
  );
  res.status(200).json(new ApiResponse(200, complaint, 'Complaint updated successfully'));
});

export const getComplaintStats = asyncHandler(async (req, res) => {
  const stats = await complaintService.getComplaintStats(req.schoolId, req.user);
  res.status(200).json(new ApiResponse(200, stats, 'Complaint stats fetched'));
});
