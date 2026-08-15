import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/ApiResponse.js';
import * as settingService from '../services/setting.service.js';

export const getSettings = asyncHandler(async (req, res) => {
  const settings = await settingService.getSettings(req.schoolId);
  res.status(200).json(new ApiResponse(200, settings));
});

export const updateSettings = asyncHandler(async (req, res) => {
  const settings = await settingService.updateSettings(req.schoolId, req.body);
  res.status(200).json(new ApiResponse(200, settings, 'Settings updated'));
});
