import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/ApiResponse.js';
import * as schoolService from '../services/school.service.js';

export const createSchool = asyncHandler(async (req, res) => {
  const school = await schoolService.createSchool(req.body);
  res.status(201).json(new ApiResponse(201, school, 'School created successfully'));
});

export const getSchools = asyncHandler(async (req, res) => {
  const result = await schoolService.getSchools(req.query);
  res.status(200).json(new ApiResponse(200, result.data, 'Schools fetched', result.meta));
});

export const getSchoolById = asyncHandler(async (req, res) => {
  const school = await schoolService.getSchoolById(req.params.id);
  res.status(200).json(new ApiResponse(200, school));
});

export const updateSchool = asyncHandler(async (req, res) => {
  const school = await schoolService.updateSchool(req.params.id, req.body);
  res.status(200).json(new ApiResponse(200, school, 'School updated'));
});

export const deleteSchool = asyncHandler(async (req, res) => {
  await schoolService.deleteSchool(req.params.id);
  res.status(200).json(new ApiResponse(200, null, 'School deleted'));
});

export const getMySchool = asyncHandler(async (req, res) => {
  if (!req.schoolId) {
    return res.status(400).json(new ApiResponse(400, null, 'No school associated'));
  }
  const school = await schoolService.getSchoolById(req.schoolId);
  res.status(200).json(new ApiResponse(200, school));
});
