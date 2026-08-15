import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/ApiResponse.js';
import ApiError from '../utils/ApiError.js';
import * as feeService from '../services/fee.service.js';

export const createFeeStructure = asyncHandler(async (req, res) => {
  const structure = await feeService.createFeeStructure(req.schoolId, req.body);
  res.status(201).json(new ApiResponse(201, structure, 'Fee structure created'));
});

export const getFeeStructures = asyncHandler(async (req, res) => {
  const result = await feeService.getFeeStructures(req.schoolId, req.query);
  res.status(200).json(new ApiResponse(200, result.data, 'Fee structures fetched', result.meta));
});

export const getFeeStructureById = asyncHandler(async (req, res) => {
  const structure = await feeService.getFeeStructureById(req.params.id, req.schoolId);
  res.status(200).json(new ApiResponse(200, structure));
});

export const updateFeeStructure = asyncHandler(async (req, res) => {
  const structure = await feeService.updateFeeStructure(req.params.id, req.schoolId, req.body);
  res.status(200).json(new ApiResponse(200, structure, 'Fee structure updated'));
});

export const deleteFeeStructure = asyncHandler(async (req, res) => {
  await feeService.deleteFeeStructure(req.params.id, req.schoolId);
  res.status(200).json(new ApiResponse(200, null, 'Fee structure deleted'));
});

export const recordPayment = asyncHandler(async (req, res) => {
  const transaction = await feeService.recordPayment(req.schoolId, req.body, req.user._id);
  res.status(201).json(new ApiResponse(201, transaction, 'Payment recorded'));
});

export const getFeeTransactions = asyncHandler(async (req, res) => {
  const result = await feeService.getFeeTransactions(req.schoolId, req.query);
  res.status(200).json(new ApiResponse(200, result.data, 'Transactions fetched', result.meta));
});

export const getStudentFeeStatus = asyncHandler(async (req, res) => {
  const result = await feeService.getStudentFeeStatus(req.schoolId, req.params.studentId);
  res.status(200).json(new ApiResponse(200, result));
});

export const getFeeReport = asyncHandler(async (req, res) => {
  const report = await feeService.getFeeReport(req.schoolId);
  res.status(200).json(new ApiResponse(200, report));
});

export const importFeeStructures = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new ApiError(400, 'Please upload a CSV or Excel file');
  }
  const result = await feeService.importFeeStructures(req.schoolId, req.file.path);
  res.status(200).json(new ApiResponse(200, result, 'Fee structures imported successfully'));
});

export const payPendingFee = asyncHandler(async (req, res) => {
  const transaction = await feeService.payPendingFee(req.schoolId, req.params.id, req.body, req.user._id);
  res.status(200).json(new ApiResponse(200, transaction, 'Payment recorded successfully'));
});
