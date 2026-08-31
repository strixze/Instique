import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/ApiResponse.js';
import * as studentService from '../services/student.service.js';

export const createStudent = asyncHandler(async (req, res) => {
  const student = await studentService.createStudent(req.schoolId, req.body);
  res.status(201).json(new ApiResponse(201, student, 'Student created'));
});

export const getStudents = asyncHandler(async (req, res) => {
  const result = await studentService.getStudents(req.schoolId, req.query);
  res.status(200).json(new ApiResponse(200, result.data, 'Students fetched', result.meta));
});

export const getStudentById = asyncHandler(async (req, res) => {
  const student = await studentService.getStudentById(req.params.id, req.schoolId);
  res.status(200).json(new ApiResponse(200, student));
});

export const updateStudent = asyncHandler(async (req, res) => {
  const student = await studentService.updateStudent(req.params.id, req.schoolId, req.body);
  res.status(200).json(new ApiResponse(200, student, 'Student updated'));
});

export const deleteStudent = asyncHandler(async (req, res) => {
  await studentService.deleteStudent(req.params.id, req.schoolId);
  res.status(200).json(new ApiResponse(200, null, 'Student deleted'));
});

export const bulkCreateStudents = asyncHandler(async (req, res) => {
  const result = await studentService.bulkCreateStudents(req.schoolId, req.body.students);
  res.status(201).json(new ApiResponse(201, result, 'Bulk student creation completed'));
});

export const promoteStudents = asyncHandler(async (req, res) => {
  const { studentIds, newClassId, newSectionId } = req.body;
  const result = await studentService.promoteStudents(req.schoolId, studentIds, newClassId, newSectionId);
  res.status(200).json(new ApiResponse(200, result, 'Students promoted'));
});

export const sendParentPasswordReset = asyncHandler(async (req, res) => {
  const { parentId } = req.body;
  const result = await studentService.sendParentPasswordReset(
    req.params.id,
    req.schoolId,
    parentId,
    req.user,
    req.ip,
    req.headers['user-agent']
  );
  res.status(200).json(new ApiResponse(200, result, result.message));
});

