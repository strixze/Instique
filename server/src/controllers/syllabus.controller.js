import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/ApiResponse.js';
import ApiError from '../utils/ApiError.js';
import * as syllabusService from '../services/syllabus.service.js';
import { getTeacherScope, verifyTeacherClassAccess } from '../services/authorization.service.js';

export const createSyllabus = asyncHandler(async (req, res) => {
  if (req.user.role === 'teacher') {
    await verifyTeacherClassAccess(req.user, req.schoolId, req.body.schoolClass);
  }
  const syllabus = await syllabusService.createSyllabus(req.schoolId, req.body);
  res.status(201).json(new ApiResponse(201, syllabus, 'Syllabus created'));
});

export const getSyllabus = asyncHandler(async (req, res) => {
  if (req.user.role === 'teacher') {
    const scope = await getTeacherScope(req.user, req.schoolId);
    // If query includes schoolClass filter, ensure teacher has access
    if (req.query.schoolClass) {
      if (!scope.classIds.includes(req.query.schoolClass.toString())) {
        return res.status(200).json(new ApiResponse(200, [], 'Syllabus fetched', { total: 0, page: 1, limit: 10, totalPages: 0 }));
      }
    } else {
      // Limit to teacher's classes
      req.query.schoolClass = { $in: scope.classIds };
    }
  }
  const result = await syllabusService.getSyllabus(req.schoolId, req.query);
  res.status(200).json(new ApiResponse(200, result.data, 'Syllabus fetched', result.meta));
});

export const getSyllabusById = asyncHandler(async (req, res) => {
  const syllabus = await syllabusService.getSyllabusById(req.params.id, req.schoolId);
  if (req.user.role === 'teacher') {
    await verifyTeacherClassAccess(req.user, req.schoolId, syllabus.schoolClass?.toString());
  }
  res.status(200).json(new ApiResponse(200, syllabus));
});

export const updateProgress = asyncHandler(async (req, res) => {
  const { chapterIndex, completedClasses } = req.body;
  const syllabus = await syllabusService.getSyllabusById(req.params.id, req.schoolId);
  if (req.user.role === 'teacher') {
    await verifyTeacherClassAccess(req.user, req.schoolId, syllabus.schoolClass?.toString());
  }
  const updated = await syllabusService.updateProgress(req.params.id, req.schoolId, chapterIndex, completedClasses);
  res.status(200).json(new ApiResponse(200, updated, 'Progress updated'));
});

export const deleteSyllabus = asyncHandler(async (req, res) => {
  const syllabus = await syllabusService.getSyllabusById(req.params.id, req.schoolId);
  if (req.user.role === 'teacher') {
    await verifyTeacherClassAccess(req.user, req.schoolId, syllabus.schoolClass?.toString());
  }
  await syllabusService.deleteSyllabus(req.params.id, req.schoolId);
  res.status(200).json(new ApiResponse(200, null, 'Syllabus deleted'));
});
