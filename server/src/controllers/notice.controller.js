import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/ApiResponse.js';
import * as noticeService from '../services/notice.service.js';

export const createNotice = asyncHandler(async (req, res) => {
  const notice = await noticeService.createNotice(req.schoolId, req.body, req.user._id);
  res.status(201).json(new ApiResponse(201, notice, 'Notice created'));
});

export const getNotices = asyncHandler(async (req, res) => {
  const result = await noticeService.getNotices(req.schoolId, req.query);
  res.status(200).json(new ApiResponse(200, result.data, 'Notices fetched', result.meta));
});

export const getNoticeById = asyncHandler(async (req, res) => {
  const notice = await noticeService.getNoticeById(req.params.id, req.schoolId);
  res.status(200).json(new ApiResponse(200, notice));
});

export const updateNotice = asyncHandler(async (req, res) => {
  const notice = await noticeService.updateNotice(req.params.id, req.schoolId, req.body);
  res.status(200).json(new ApiResponse(200, notice, 'Notice updated'));
});

export const deleteNotice = asyncHandler(async (req, res) => {
  await noticeService.deleteNotice(req.params.id, req.schoolId);
  res.status(200).json(new ApiResponse(200, null, 'Notice deleted'));
});
