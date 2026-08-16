import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/ApiResponse.js';
import * as examService from '../services/exam.service.js';

export const createExam = asyncHandler(async (req, res) => {
  const exam = await examService.createExam(req.schoolId, req.body);
  res.status(201).json(new ApiResponse(201, exam, 'Exam created'));
});

export const getExams = asyncHandler(async (req, res) => {
  const result = await examService.getExams(req.schoolId, req.query);
  res.status(200).json(new ApiResponse(200, result.data, 'Exams fetched', result.meta));
});

export const getExamById = asyncHandler(async (req, res) => {
  const exam = await examService.getExamById(req.params.id, req.schoolId);
  res.status(200).json(new ApiResponse(200, exam));
});

export const updateExam = asyncHandler(async (req, res) => {
  const exam = await examService.updateExam(req.params.id, req.schoolId, req.body);
  res.status(200).json(new ApiResponse(200, exam, 'Exam updated'));
});

export const deleteExam = asyncHandler(async (req, res) => {
  await examService.deleteExam(req.params.id, req.schoolId);
  res.status(200).json(new ApiResponse(200, null, 'Exam deleted'));
});

export const enterMark = asyncHandler(async (req, res) => {
  const mark = await examService.enterMark(req.schoolId, req.body, req.user._id);
  res.status(201).json(new ApiResponse(201, mark, 'Marks entered'));
});

export const getMarks = asyncHandler(async (req, res) => {
  const result = await examService.getMarks(req.schoolId, req.query);
  res.status(200).json(new ApiResponse(200, result.data, 'Marks fetched', result.meta));
});

export const getMarksByExam = asyncHandler(async (req, res) => {
  const marks = await examService.getMarksByExam(req.schoolId, req.params.examId);
  res.status(200).json(new ApiResponse(200, marks));
});

export const publishResults = asyncHandler(async (req, res) => {
  const exam = await examService.publishResults(req.schoolId, req.params.examId);
  res.status(200).json(new ApiResponse(200, exam, 'Results published'));
});

export const getExamStudents = asyncHandler(async (req, res) => {
  const students = await examService.getExamStudents(req.schoolId, req.params.examId);
  res.status(200).json(new ApiResponse(200, students, 'Exam students fetched'));
});

export const saveMarksBulk = asyncHandler(async (req, res) => {
  const result = await examService.saveMarks(req.schoolId, req.params.examId, req.body.marks, req.body.status, req.user._id);
  res.status(200).json(new ApiResponse(200, result, 'Marks saved'));
});

export const getExamResults = asyncHandler(async (req, res) => {
  const results = await examService.getExamResults(req.schoolId, req.params.examId);
  res.status(200).json(new ApiResponse(200, results, 'Exam results fetched'));
});
