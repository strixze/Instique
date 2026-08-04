import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/ApiResponse.js';
import * as teacherService from '../services/teacher.service.js';

export const createTeacher = asyncHandler(async (req, res) => {
  const teacher = await teacherService.createTeacher(req.schoolId, req.body);
  res.status(201).json(new ApiResponse(201, teacher, 'Teacher created'));
});

export const getTeachers = asyncHandler(async (req, res) => {
  const result = await teacherService.getTeachers(req.schoolId, req.query);
  res.status(200).json(new ApiResponse(200, result.data, 'Teachers fetched', result.meta));
});

export const getTeacherById = asyncHandler(async (req, res) => {
  const teacher = await teacherService.getTeacherById(req.params.id, req.schoolId);
  res.status(200).json(new ApiResponse(200, teacher));
});

export const updateTeacher = asyncHandler(async (req, res) => {
  const teacher = await teacherService.updateTeacher(req.params.id, req.schoolId, req.body);
  res.status(200).json(new ApiResponse(200, teacher, 'Teacher updated'));
});

export const deleteTeacher = asyncHandler(async (req, res) => {
  await teacherService.deleteTeacher(req.params.id, req.schoolId);
  res.status(200).json(new ApiResponse(200, null, 'Teacher deleted'));
});

export const getWorkloadAnalytics = asyncHandler(async (req, res) => {
  const analytics = await teacherService.getWorkloadAnalytics(req.schoolId);
  res.status(200).json(new ApiResponse(200, analytics));
});
