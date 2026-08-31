import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/ApiResponse.js';
import * as admissionService from '../services/admission.service.js';

export const createAdmission = asyncHandler(async (req, res) => {
  const admission = await admissionService.createAdmission(req.schoolId, req.body, req.user._id);
  res.status(201).json(new ApiResponse(201, admission, 'Admission application submitted'));
});

export const getAdmissionStats = asyncHandler(async (req, res) => {
  const stats = await admissionService.getAdmissionStats(req.schoolId);
  res.status(200).json(new ApiResponse(200, stats, 'Admission statistics fetched'));
});

export const getAdmissions = asyncHandler(async (req, res) => {
  const result = await admissionService.getAdmissions(req.schoolId, req.query);
  res.status(200).json(new ApiResponse(200, result.data, 'Admissions fetched', result.meta));
});

export const getAdmissionById = asyncHandler(async (req, res) => {
  const admission = await admissionService.getAdmissionById(req.params.id, req.schoolId);
  res.status(200).json(new ApiResponse(200, admission));
});

export const updateAdmissionStatus = asyncHandler(async (req, res) => {
  const { workflowStatus, remarks } = req.body;
  const admission = await admissionService.updateAdmissionStatus(req.params.id, req.schoolId, workflowStatus, remarks, req.user._id);
  res.status(200).json(new ApiResponse(200, admission, 'Admission status updated'));
});

export const uploadDocuments = asyncHandler(async (req, res) => {
  const docs = req.files?.map((f) => ({ name: f.originalname, type: f.mimetype, url: `/uploads/${f.filename}` })) || [];
  const admission = await admissionService.updateDocuments(req.params.id, req.schoolId, docs);
  res.status(200).json(new ApiResponse(200, admission, 'Documents uploaded'));
});

export const updateDocumentStatus = asyncHandler(async (req, res) => {
  const { documentId } = req.params;
  const { status, rejectionReason } = req.body;
  const admission = await admissionService.updateDocumentStatus(req.params.id, req.schoolId, documentId, { status, rejectionReason }, req.user._id);
  res.status(200).json(new ApiResponse(200, admission, 'Document verification status updated'));
});

export const allocateClassSection = asyncHandler(async (req, res) => {
  const { assignedClassId, assignedSectionId } = req.body;
  const admission = await admissionService.allocateClassSection(req.params.id, req.schoolId, { assignedClassId, assignedSectionId }, req.user._id);
  res.status(200).json(new ApiResponse(200, admission, 'Class and section allocated successfully'));
});

export const assignFeeStructure = asyncHandler(async (req, res) => {
  const { feeStructureId, discountName, discountValue } = req.body;
  const admission = await admissionService.assignFeeStructure(req.params.id, req.schoolId, { feeStructureId, discountName, discountValue }, req.user._id);
  res.status(200).json(new ApiResponse(200, admission, 'Fee structure assigned successfully'));
});

export const recordManualPayment = asyncHandler(async (req, res) => {
  const { admission, transaction } = await admissionService.recordManualPayment(req.params.id, req.schoolId, req.body, req.user._id);
  res.status(200).json(new ApiResponse(200, { admission, transaction }, 'Admission payment recorded successfully'));
});

export const confirmAdmission = asyncHandler(async (req, res) => {
  const result = await admissionService.confirmAdmission(req.params.id, req.schoolId, req.user._id);
  res.status(200).json(new ApiResponse(200, result, 'Admission confirmed and student record created successfully'));
});

export const resendActivationEmail = asyncHandler(async (req, res) => {
  const ip = req.ip;
  const userAgent = req.headers['user-agent'] || '';
  const result = await admissionService.resendAdmissionActivationEmail(req.params.id, req.schoolId, req.user._id, ip, userAgent);
  res.status(200).json(new ApiResponse(200, result, result.message));
});

