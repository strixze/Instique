import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/ApiResponse.js';
import * as settingService from '../services/setting.service.js';

export const getSettings = asyncHandler(async (req, res) => {
  const settings = await settingService.getSettings(req.schoolId);
  res.status(200).json(new ApiResponse(200, settings, 'Settings retrieved successfully'));
});

export const updateSettings = asyncHandler(async (req, res) => {
  const meta = {
    ip: req.ip || req.connection?.remoteAddress,
    userAgent: req.headers['user-agent'],
  };
  const settings = await settingService.updateSettings(req.schoolId, req.body, req.user?._id, meta);
  res.status(200).json(new ApiResponse(200, settings, 'Settings updated successfully'));
});

export const updateSection = asyncHandler(async (req, res) => {
  const meta = {
    ip: req.ip || req.connection?.remoteAddress,
    userAgent: req.headers['user-agent'],
  };
  const settings = await settingService.updateSection(
    req.schoolId,
    req.params.section,
    req.body,
    req.user?._id,
    meta
  );
  res.status(200).json(new ApiResponse(200, settings, `Settings for ${req.params.section} updated successfully`));
});

export const getPublicSettings = asyncHandler(async (req, res) => {
  const settings = await settingService.getPublicSettings(req.schoolId);
  res.status(200).json(new ApiResponse(200, settings, 'Public settings retrieved'));
});
