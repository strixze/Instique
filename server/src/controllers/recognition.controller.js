import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/ApiResponse.js';
import * as recognitionService from '../services/recognition.service.js';

export const awardPoints = asyncHandler(async (req, res) => {
  const point = await recognitionService.awardPoints(req.schoolId, req.body, req.user._id);
  res.status(201).json(new ApiResponse(201, point, 'Points awarded'));
});

export const getRecognitionHistory = asyncHandler(async (req, res) => {
  const result = await recognitionService.getRecognitionHistory(req.schoolId, req.params.studentId, req.query);
  res.status(200).json(new ApiResponse(200, result.data, 'History fetched', result.meta));
});

export const getLeaderboard = asyncHandler(async (req, res) => {
  const { category } = req.query;
  const leaderboard = await recognitionService.getLeaderboard(req.schoolId, category);
  res.status(200).json(new ApiResponse(200, leaderboard));
});

export const createBadge = asyncHandler(async (req, res) => {
  const badge = await recognitionService.createBadge(req.schoolId, req.body);
  res.status(201).json(new ApiResponse(201, badge, 'Badge created'));
});

export const getBadges = asyncHandler(async (req, res) => {
  const badges = await recognitionService.getBadges(req.schoolId);
  res.status(200).json(new ApiResponse(200, badges));
});

export const awardBadge = asyncHandler(async (req, res) => {
  const badge = await recognitionService.awardBadge(req.schoolId, req.params.badgeId, req.body.student);
  res.status(200).json(new ApiResponse(200, badge, 'Badge awarded'));
});
