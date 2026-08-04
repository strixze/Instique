import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/ApiResponse.js';
import * as academicService from '../services/academic.service.js';

export const createAcademicYear = asyncHandler(async (req, res) => {
  const year = await academicService.createAcademicYear(req.schoolId, req.body);
  res.status(201).json(new ApiResponse(201, year, 'Academic year created'));
});

export const getAcademicYears = asyncHandler(async (req, res) => {
  const result = await academicService.getAcademicYears(req.schoolId, req.query);
  res.status(200).json(new ApiResponse(200, result.data, 'Academic years fetched', result.meta));
});

export const updateAcademicYear = asyncHandler(async (req, res) => {
  const year = await academicService.updateAcademicYear(req.params.id, req.schoolId, req.body);
  res.status(200).json(new ApiResponse(200, year, 'Academic year updated'));
});

export const deleteAcademicYear = asyncHandler(async (req, res) => {
  await academicService.deleteAcademicYear(req.params.id, req.schoolId);
  res.status(200).json(new ApiResponse(200, null, 'Academic year deleted'));
});

export const createClass = asyncHandler(async (req, res) => {
  const schoolClass = await academicService.createClass(req.schoolId, req.body);
  res.status(201).json(new ApiResponse(201, schoolClass, 'Class created'));
});

export const getClasses = asyncHandler(async (req, res) => {
  const result = await academicService.getClasses(req.schoolId, req.query);
  res.status(200).json(new ApiResponse(200, result.data, 'Classes fetched', result.meta));
});

export const getClassById = asyncHandler(async (req, res) => {
  const schoolClass = await academicService.getClassById(req.params.id, req.schoolId);
  res.status(200).json(new ApiResponse(200, schoolClass));
});

export const updateClass = asyncHandler(async (req, res) => {
  const schoolClass = await academicService.updateClass(req.params.id, req.schoolId, req.body);
  res.status(200).json(new ApiResponse(200, schoolClass, 'Class updated'));
});

export const deleteClass = asyncHandler(async (req, res) => {
  await academicService.deleteClass(req.params.id, req.schoolId);
  res.status(200).json(new ApiResponse(200, null, 'Class deleted'));
});

export const createSection = asyncHandler(async (req, res) => {
  const section = await academicService.createSection(req.schoolId, req.body);
  res.status(201).json(new ApiResponse(201, section, 'Section created'));
});

export const getSections = asyncHandler(async (req, res) => {
  const result = await academicService.getSections(req.schoolId, req.query);
  res.status(200).json(new ApiResponse(200, result.data, 'Sections fetched', result.meta));
});

export const getSectionsByClass = asyncHandler(async (req, res) => {
  const sections = await academicService.getSectionsByClass(req.params.classId, req.schoolId);
  res.status(200).json(new ApiResponse(200, sections));
});

export const updateSection = asyncHandler(async (req, res) => {
  const section = await academicService.updateSection(req.params.id, req.schoolId, req.body);
  res.status(200).json(new ApiResponse(200, section, 'Section updated'));
});

export const deleteSection = asyncHandler(async (req, res) => {
  await academicService.deleteSection(req.params.id, req.schoolId);
  res.status(200).json(new ApiResponse(200, null, 'Section deleted'));
});

export const createSubject = asyncHandler(async (req, res) => {
  const subject = await academicService.createSubject(req.schoolId, req.body);
  res.status(201).json(new ApiResponse(201, subject, 'Subject created'));
});

export const getSubjects = asyncHandler(async (req, res) => {
  const result = await academicService.getSubjects(req.schoolId, req.query);
  res.status(200).json(new ApiResponse(200, result.data, 'Subjects fetched', result.meta));
});

export const updateSubject = asyncHandler(async (req, res) => {
  const subject = await academicService.updateSubject(req.params.id, req.schoolId, req.body);
  res.status(200).json(new ApiResponse(200, subject, 'Subject updated'));
});

export const deleteSubject = asyncHandler(async (req, res) => {
  await academicService.deleteSubject(req.params.id, req.schoolId);
  res.status(200).json(new ApiResponse(200, null, 'Subject deleted'));
});
