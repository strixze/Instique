import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/ApiResponse.js';
import ApiError from '../utils/ApiError.js';
import * as syllabusService from '../services/syllabus.service.js';
import { verifyParentAccessToStudent, verifyTeacherClassAccess } from '../services/authorization.service.js';

export const createSyllabus = asyncHandler(async (req, res) => {
  const syllabus = await syllabusService.createSyllabus(req.schoolId, req.body, req.user);
  res.status(201).json(new ApiResponse(201, syllabus, 'Syllabus definition created'));
});

export const getSyllabus = asyncHandler(async (req, res) => {
  const result = await syllabusService.getSyllabus(req.schoolId, req.query);
  res.status(200).json(new ApiResponse(200, result.data, 'Syllabi fetched successfully', result.meta));
});

export const getSyllabusById = asyncHandler(async (req, res) => {
  const result = await syllabusService.getSyllabusById(req.params.id, req.schoolId);
  res.status(200).json(new ApiResponse(200, result));
});

export const updateSyllabus = asyncHandler(async (req, res) => {
  const updated = await syllabusService.updateSyllabus(req.params.id, req.schoolId, req.body, req.user);
  res.status(200).json(new ApiResponse(200, updated, 'Syllabus updated successfully'));
});

export const publishSyllabus = asyncHandler(async (req, res) => {
  const published = await syllabusService.publishSyllabus(req.params.id, req.schoolId, req.user);
  res.status(200).json(new ApiResponse(200, published, 'Syllabus published successfully'));
});

export const archiveSyllabus = asyncHandler(async (req, res) => {
  const archived = await syllabusService.archiveSyllabus(req.params.id, req.schoolId, req.user);
  res.status(200).json(new ApiResponse(200, archived, 'Syllabus archived successfully'));
});

export const deleteSyllabus = asyncHandler(async (req, res) => {
  await syllabusService.deleteSyllabus(req.params.id, req.schoolId);
  res.status(200).json(new ApiResponse(200, null, 'Syllabus deleted successfully'));
});

export const assignSections = asyncHandler(async (req, res) => {
  const { sectionIds } = req.body;
  const tracks = await syllabusService.assignSyllabusToSections(req.params.id, req.schoolId, sectionIds, req.user);
  res.status(200).json(new ApiResponse(200, tracks, 'Syllabus assigned to sections successfully'));
});

export const getTrackById = asyncHandler(async (req, res) => {
  const track = await syllabusService.getTrackById(req.params.trackId, req.schoolId);
  res.status(200).json(new ApiResponse(200, track));
});

export const updateTopicProgress = asyncHandler(async (req, res) => {
  const { status, notes } = req.body;
  const { trackId, topicId } = req.params;

  // Authorization check for teachers
  if (req.user.role === 'teacher') {
    const trackDetails = await syllabusService.getTrackById(trackId, req.schoolId);
    if (trackDetails.track?.schoolClass?._id) {
      await verifyTeacherClassAccess(req.user, req.schoolId, trackDetails.track.schoolClass._id.toString());
    }
  }

  const updatedTrack = await syllabusService.updateTopicProgress(trackId, topicId, req.schoolId, status, notes, req.user);
  res.status(200).json(new ApiResponse(200, updatedTrack, 'Topic progress updated successfully'));
});

export const getSyllabusAnalytics = asyncHandler(async (req, res) => {
  const analytics = await syllabusService.getSyllabusAnalytics(req.schoolId);
  res.status(200).json(new ApiResponse(200, analytics, 'Syllabus analytics fetched successfully'));
});

export const getTeacherSyllabus = asyncHandler(async (req, res) => {
  const tracks = await syllabusService.getTeacherSyllabusTracks(req.schoolId, req.query.teacherId, req.user);
  res.status(200).json(new ApiResponse(200, tracks, 'Teacher syllabus tracks fetched'));
});

export const getParentChildSyllabus = asyncHandler(async (req, res) => {
  const { studentId } = req.params;
  await verifyParentAccessToStudent(req.user, req.schoolId, studentId);
  const tracks = await syllabusService.getParentChildSyllabusTracks(req.schoolId, studentId, req.user);
  res.status(200).json(new ApiResponse(200, tracks, 'Child syllabus tracks fetched'));
});
