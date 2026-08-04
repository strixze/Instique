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
