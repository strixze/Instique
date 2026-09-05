import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/ApiResponse.js';
import * as teacherService from '../services/teacher.service.js';

export const createTeacher = asyncHandler(async (req, res) => {
  // Pass adminUser with explicit _id and request metadata for audit logging
  const adminUser = {
    _id: req.user?._id,
    email: req.user?.email,
    role: req.user?.role,
    _ip: req.ip,
    _userAgent: req.headers['user-agent'],
  };
  const teacher = await teacherService.createTeacher(req.schoolId, req.body, adminUser);
  res.status(201).json(new ApiResponse(201, teacher, 'Teacher created successfully'));
});

export const getTeachers = asyncHandler(async (req, res) => {
  const result = await teacherService.getTeachers(req.schoolId, req.query);
  res.status(200).json(new ApiResponse(200, result.data, 'Teachers fetched', result.meta));
});

export const getTeacherById = asyncHandler(async (req, res) => {
  const teacher = await teacherService.getTeacherById(req.params.id, req.schoolId);
  res.status(200).json(new ApiResponse(200, teacher));
});

export const getTeacherProfile = asyncHandler(async (req, res) => {
  const profile = await teacherService.getTeacherProfile(req.params.id, req.schoolId, req.user);
  res.status(200).json(new ApiResponse(200, profile));
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

export const resendTeacherActivationEmail = asyncHandler(async (req, res) => {
  const result = await teacherService.resendTeacherActivationEmail(
    req.params.id,
    req.schoolId,
    req.user,
    req.ip,
    req.headers['user-agent']
  );
  res.status(200).json(new ApiResponse(200, result, result.message));
});

export const sendTeacherPasswordReset = asyncHandler(async (req, res) => {
  const result = await teacherService.sendTeacherPasswordReset(
    req.params.id,
    req.schoolId,
    req.user,
    req.ip,
    req.headers['user-agent']
  );
  res.status(200).json(new ApiResponse(200, result, result.message));
});
