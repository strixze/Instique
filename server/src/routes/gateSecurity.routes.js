import { Router } from 'express';
import authMiddleware from '../middlewares/auth.middleware.js';
import { requireRole } from '../middlewares/rbac.middleware.js';
import tenantMiddleware from '../middlewares/tenant.middleware.js';
import validate from '../middlewares/validate.middleware.js';
import {
  scanRfidSchema,
  manualStudentGateEventSchema,
  unknownStudentSchema,
  visitorEntrySchema,
  visitorExitSchema,
  createVehicleSchema,
  vehicleGateEventSchema,
} from '../validators/gateSecurity.validator.js';
import {
  scanRfid,
  getMockRfidTags,
  searchStudents,
  recordManualStudentEvent,
  recordUnknownStudentEvent,
  recordVisitorEntry,
  getActiveVisitors,
  recordVisitorExit,
  getVehicles,
  createVehicle,
  recordVehicleGateEvent,
  getGateSummary,
  getGateActivity,
} from '../controllers/gateSecurity.controller.js';

const router = Router();

// Strict tenant and role authorization: only security_guard, school_admin, and super_admin
router.use(authMiddleware, tenantMiddleware);
router.use(requireRole('security_guard', 'school_admin', 'super_admin'));

// Mock RFID Scanning & Tag discovery
router.post('/scan-rfid', validate(scanRfidSchema), scanRfid);
router.get('/mock-rfid/tags', getMockRfidTags);

// Student Gate Operations
router.get('/students/search', searchStudents);
router.post('/students/gate-event', validate(manualStudentGateEventSchema), recordManualStudentEvent);

// Unknown Student
router.post('/unknown-student', validate(unknownStudentSchema), recordUnknownStudentEvent);

// Visitor Operations
router.post('/visitors/entry', validate(visitorEntrySchema), recordVisitorEntry);
router.get('/visitors/active', getActiveVisitors);
router.post('/visitors/:id/exit', validate(visitorExitSchema), recordVisitorExit);

// School Vans / Vehicles
router.get('/vehicles', getVehicles);
router.post('/vehicles', validate(createVehicleSchema), createVehicle);
router.post('/vehicles/gate-event', validate(vehicleGateEventSchema), recordVehicleGateEvent);

// Operational Dashboard Summary & Activity Log
router.get('/summary', getGateSummary);
router.get('/activity', getGateActivity);

export default router;
