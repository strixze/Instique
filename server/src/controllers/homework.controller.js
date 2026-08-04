import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/ApiResponse.js';
import * as homeworkService from '../services/homework.service.js';

export const createHomework = asyncHandler(async (req, res) => {
  const homework = await homeworkService.createHomework(req.schoolId, req.body, req.user._id);
  res.status(201).json(new ApiResponse(201, homework, 'Homework created'));
});

export const getHomework = asyncHandler(async (req, res) => {
  const result = await homeworkService.getHomework(req.schoolId, req.query);
  res.status(200).json(new ApiResponse(200, result.data, 'Homework fetched', result.meta));
});

export const getHomeworkById = asyncHandler(async (req, res) => {
  const homework = await homeworkService.getHomeworkById(req.params.id, req.schoolId);
  res.status(200).json(new ApiResponse(200, homework));
});

export const updateHomework = asyncHandler(async (req, res) => {
  const homework = await homeworkService.updateHomework(req.params.id, req.schoolId, req.body);
  res.status(200).json(new ApiResponse(200, homework, 'Homework updated'));
});

export const deleteHomework = asyncHandler(async (req, res) => {
  await homeworkService.deleteHomework(req.params.id, req.schoolId);
  res.status(200).json(new ApiResponse(200, null, 'Homework deleted'));
});

export const submitHomework = asyncHandler(async (req, res) => {
  const homework = await homeworkService.submitHomework(req.params.id, req.schoolId, req.user._id, req.body);
  res.status(200).json(new ApiResponse(200, homework, 'Homework submitted'));
});
