import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/ApiResponse.js';
import * as gateSecurityService from '../services/gateSecurity.service.js';

export const scanRfid = asyncHandler(async (req, res) => {
  const result = await gateSecurityService.scanRfid(
    req.schoolId,
    req.body.rfidTag,
    req.user._id,
    req.body.gate
  );
  res.status(200).json(new ApiResponse(200, result, 'RFID scanned and gate event recorded'));
});

export const getMockRfidTags = asyncHandler(async (req, res) => {
  const tags = await gateSecurityService.getMockRfidTags(req.schoolId);
  res.status(200).json(new ApiResponse(200, tags, 'Mock RFID tags fetched'));
});

export const searchStudents = asyncHandler(async (req, res) => {
  const students = await gateSecurityService.searchStudents(req.schoolId, req.query.search || req.query.q);
  res.status(200).json(new ApiResponse(200, students, 'Students fetched'));
});

export const recordManualStudentEvent = asyncHandler(async (req, res) => {
  const { studentId, eventType, gate, notes } = req.body;
  const result = await gateSecurityService.recordManualStudentEvent(
    req.schoolId,
    studentId,
    eventType,
    req.user._id,
    gate,
    notes
  );
  res.status(201).json(new ApiResponse(201, result, 'Manual student gate event recorded'));
});

export const recordUnknownStudentEvent = asyncHandler(async (req, res) => {
  const result = await gateSecurityService.recordUnknownStudentEvent(
    req.schoolId,
    req.body,
    req.user._id
  );
  res.status(201).json(new ApiResponse(201, result, 'Unknown student event recorded'));
});

export const recordVisitorEntry = asyncHandler(async (req, res) => {
  const result = await gateSecurityService.recordVisitorEntry(
    req.schoolId,
    req.body,
    req.user._id
  );
  res.status(201).json(new ApiResponse(201, result, 'Visitor entry recorded'));
});

export const getActiveVisitors = asyncHandler(async (req, res) => {
  const visitors = await gateSecurityService.getActiveVisitors(req.schoolId);
  res.status(200).json(new ApiResponse(200, visitors, 'Active visitors fetched'));
});

export const recordVisitorExit = asyncHandler(async (req, res) => {
  const result = await gateSecurityService.recordVisitorExit(
    req.schoolId,
    req.params.id,
    req.user._id,
    req.body.notes,
    req.body.gate
  );
  res.status(200).json(new ApiResponse(200, result, 'Visitor exit recorded'));
});

export const getVehicles = asyncHandler(async (req, res) => {
  const vehicles = await gateSecurityService.getVehicles(req.schoolId);
  res.status(200).json(new ApiResponse(200, vehicles, 'Vehicles fetched'));
});

export const createVehicle = asyncHandler(async (req, res) => {
  const vehicle = await gateSecurityService.createVehicle(req.schoolId, req.body);
  res.status(201).json(new ApiResponse(201, vehicle, 'Vehicle registered'));
});

export const recordVehicleGateEvent = asyncHandler(async (req, res) => {
  const { vehicleId, eventType, gate, notes } = req.body;
  const result = await gateSecurityService.recordVehicleGateEvent(
    req.schoolId,
    vehicleId,
    eventType,
    req.user._id,
    gate,
    notes
  );
  res.status(201).json(new ApiResponse(201, result, 'Vehicle gate event recorded'));
});

export const getGateSummary = asyncHandler(async (req, res) => {
  const summary = await gateSecurityService.getGateSummary(req.schoolId);
  res.status(200).json(new ApiResponse(200, summary, 'Gate summary fetched'));
});

export const getGateActivity = asyncHandler(async (req, res) => {
  const result = await gateSecurityService.getGateActivity(req.schoolId, req.query);
  res.status(200).json(new ApiResponse(200, result.data, 'Gate activity fetched', result.meta));
});
