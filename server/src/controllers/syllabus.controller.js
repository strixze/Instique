import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/ApiResponse.js';
import * as syllabusService from '../services/syllabus.service.js';

export const createSyllabus = asyncHandler(async (req, res) => {
  const syllabus = await syllabusService.createSyllabus(req.schoolId, req.body);
  res.status(201).json(new ApiResponse(201, syllabus, 'Syllabus created'));
});

export const getSyllabus = asyncHandler(async (req, res) => {
  const result = await syllabusService.getSyllabus(req.schoolId, req.query);
  res.status(200).json(new ApiResponse(200, result.data, 'Syllabus fetched', result.meta));
});

export const getSyllabusById = asyncHandler(async (req, res) => {
  const syllabus = await syllabusService.getSyllabusById(req.params.id, req.schoolId);
  res.status(200).json(new ApiResponse(200, syllabus));
});

export const updateProgress = asyncHandler(async (req, res) => {
  const { chapterIndex, completedClasses } = req.body;
  const syllabus = await syllabusService.updateProgress(req.params.id, req.schoolId, chapterIndex, completedClasses);
  res.status(200).json(new ApiResponse(200, syllabus, 'Progress updated'));
});

export const deleteSyllabus = asyncHandler(async (req, res) => {
  await syllabusService.deleteSyllabus(req.params.id, req.schoolId);
  res.status(200).json(new ApiResponse(200, null, 'Syllabus deleted'));
});
