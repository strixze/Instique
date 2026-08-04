import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/ApiResponse.js';
import * as saasService from '../services/saas.service.js';

export const onboardSchool = asyncHandler(async (req, res) => {
  const { school, admin } = await saasService.onboardSchool(req.body.school, req.body.admin);
  res.status(201).json(new ApiResponse(201, { school, admin }, 'School onboarded'));
});

export const getSubscriptions = asyncHandler(async (req, res) => {
  const result = await saasService.getSubscriptions(req.query);
  res.status(200).json(new ApiResponse(200, result.data, 'Subscriptions fetched', result.meta));
});

export const updateSubscription = asyncHandler(async (req, res) => {
  const sub = await saasService.updateSubscription(req.params.id, req.body);
  res.status(200).json(new ApiResponse(200, sub, 'Subscription updated'));
});

export const getPlatformStats = asyncHandler(async (req, res) => {
  const stats = await saasService.getPlatformStats();
  res.status(200).json(new ApiResponse(200, stats));
});
