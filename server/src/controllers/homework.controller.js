import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/ApiResponse.js';
import * as homeworkService from '../services/homework.service.js';

export const getTeacherAssignments = asyncHandler(async (req, res) => {
  const assignments = await homeworkService.getTeacherAssignments(req.schoolId, req.user);
  res.status(200).json(new ApiResponse(200, assignments, 'Teacher assignments fetched'));
});

export const createHomework = asyncHandler(async (req, res) => {
  const files = req.files || (req.file ? [req.file] : []);
  const homework = await homeworkService.createHomework(req.schoolId, req.user, req.body, files);
  res.status(201).json(new ApiResponse(201, homework, 'Homework created successfully'));
});

export const getHomework = asyncHandler(async (req, res) => {
  const result = await homeworkService.getHomework(req.schoolId, req.user, req.query);
  res.status(200).json(new ApiResponse(200, result.data, 'Homework fetched successfully', result.meta));
});

export const getHomeworkById = asyncHandler(async (req, res) => {
  const homework = await homeworkService.getHomeworkById(req.params.id, req.schoolId, req.user);
  res.status(200).json(new ApiResponse(200, homework, 'Homework details fetched'));
});

export const updateHomework = asyncHandler(async (req, res) => {
  const files = req.files || (req.file ? [req.file] : []);
  const homework = await homeworkService.updateHomework(req.params.id, req.schoolId, req.user, req.body, files);
  res.status(200).json(new ApiResponse(200, homework, 'Homework updated successfully'));
});

export const publishHomework = asyncHandler(async (req, res) => {
  const homework = await homeworkService.publishHomework(req.params.id, req.schoolId, req.user);
  res.status(200).json(new ApiResponse(200, homework, 'Homework published successfully'));
});

export const cancelHomework = asyncHandler(async (req, res) => {
  const homework = await homeworkService.cancelHomework(req.params.id, req.schoolId, req.user);
  res.status(200).json(new ApiResponse(200, homework, 'Homework cancelled successfully'));
});

export const deleteHomework = asyncHandler(async (req, res) => {
  await homeworkService.deleteHomework(req.params.id, req.schoolId, req.user);
  res.status(200).json(new ApiResponse(200, null, 'Homework deleted successfully'));
});

export const submitHomework = asyncHandler(async (req, res) => {
  const files = req.files || (req.file ? [req.file] : []);
  const homework = await homeworkService.submitHomework(req.params.id, req.schoolId, req.user, req.body, files);
  res.status(200).json(new ApiResponse(200, homework, 'Homework submitted successfully'));
});
