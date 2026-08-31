import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/ApiResponse.js';
import * as timetableConfigService from '../services/timetableConfig.service.js';

export const createConfig = asyncHandler(async (req, res) => {
  const config = await timetableConfigService.createConfig(req.schoolId, req.body);
  res.status(201).json(new ApiResponse(201, config, 'Timetable configuration created'));
});

export const getConfig = asyncHandler(async (req, res) => {
  const { academicYear } = req.query;
  const config = await timetableConfigService.getConfig(req.schoolId, academicYear);
  res.status(200).json(new ApiResponse(200, config, 'Timetable configuration fetched'));
});

export const updateConfig = asyncHandler(async (req, res) => {
  const config = await timetableConfigService.updateConfig(req.params.id, req.schoolId, req.body);
  res.status(200).json(new ApiResponse(200, config, 'Timetable configuration updated'));
});
