import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/ApiResponse.js';
import * as substitutionService from '../services/substitution.service.js';

export const getSubstitutions = asyncHandler(async (req, res) => {
  const result = await substitutionService.getSubstitutions(req.schoolId, req.query);
  res.status(200).json(new ApiResponse(200, result.data, 'Substitutions fetched successfully', result.meta));
});

export const getEligibleTeachersForSlot = asyncHandler(async (req, res) => {
  const options = {
    date: req.query.date,
    day: req.query.day !== undefined ? Number(req.query.day) : undefined,
    startTime: req.query.startTime,
    endTime: req.query.endTime,
    periodNo: req.query.periodNo ? Number(req.query.periodNo) : undefined,
    originalTeacherId: req.query.originalTeacherId,
    subjectId: req.query.subjectId,
    classId: req.query.classId,
  };

  const result = await substitutionService.getEligibleTeachersForLectureSlot(req.schoolId, options);
  res.status(200).json(new ApiResponse(200, result, 'Eligible substitute teachers calculated'));
});

export const cancelSubstitution = asyncHandler(async (req, res) => {
  const result = await substitutionService.cancelSubstitution({
    schoolId: req.schoolId,
    substitutionId: req.params.id,
    userId: req.user._id,
    reason: req.body.reason,
  });
  res.status(200).json(new ApiResponse(200, result, 'Substitution cancelled'));
});

export const getMySubstitutions = asyncHandler(async (req, res) => {
  const result = await substitutionService.getMySubstitutions(req.schoolId, req.user._id, req.query);
  res.status(200).json(new ApiResponse(200, result.data, 'My assigned substitutions fetched', result.meta));
});
