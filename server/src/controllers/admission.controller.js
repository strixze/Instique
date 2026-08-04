import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/ApiResponse.js';
import * as admissionService from '../services/admission.service.js';

export const createAdmission = asyncHandler(async (req, res) => {
  const admission = await admissionService.createAdmission(req.schoolId, req.body);
  res.status(201).json(new ApiResponse(201, admission, 'Admission application submitted'));
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
  const admission = await admissionService.updateAdmissionStatus(req.params.id, req.schoolId, workflowStatus, remarks);
  res.status(200).json(new ApiResponse(200, admission, 'Admission status updated'));
});

export const uploadDocuments = asyncHandler(async (req, res) => {
  const docs = req.files?.map((f) => ({ name: f.originalname, type: f.mimetype, url: `/uploads/${f.filename}` })) || [];
  const admission = await admissionService.updateDocuments(req.params.id, req.schoolId, docs);
  res.status(200).json(new ApiResponse(200, admission, 'Documents uploaded'));
});
