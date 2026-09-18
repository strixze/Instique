import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import mongoose from 'mongoose';
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
  recordVehicleGateEvent,
  getGateSummary,
  getGateActivity,
} from '../gateSecurity.service.js';
import GateLog from '../../models/GateLog.js';
import StudentRfidMapping from '../../models/StudentRfidMapping.js';
import SchoolVehicle from '../../models/SchoolVehicle.js';
import Student from '../../models/Student.js';
import Attendance from '../../models/Attendance.js';

describe('Gate Security Service & Attendance Isolation Tests', () => {
  const schoolAId = new mongoose.Types.ObjectId().toString();
  const schoolBId = new mongoose.Types.ObjectId().toString();
  const guardUserId = new mongoose.Types.ObjectId().toString();
  const studentAId = new mongoose.Types.ObjectId().toString();
  const studentBId = new mongoose.Types.ObjectId().toString();
  const vehicleId = new mongoose.Types.ObjectId().toString();

  let originals = {};

  beforeEach(() => {
    originals = {
      GateLogCreate: GateLog.create,
      GateLogFind: GateLog.find,
      GateLogFindOne: GateLog.findOne,
      GateLogCountDocuments: GateLog.countDocuments,
      StudentRfidMappingFind: StudentRfidMapping.find,
      StudentRfidMappingFindOne: StudentRfidMapping.findOne,
      StudentRfidMappingCreate: StudentRfidMapping.create,
      SchoolVehicleFind: SchoolVehicle.find,
      SchoolVehicleFindOne: SchoolVehicle.findOne,
      SchoolVehicleInsertMany: SchoolVehicle.insertMany,
      StudentFind: Student.find,
      StudentFindOne: Student.findOne,
      AttendanceCreate: Attendance.create,
      AttendanceFind: Attendance.find,
      AttendanceFindOne: Attendance.findOne,
      AttendanceUpdateOne: Attendance.updateOne,
      AttendanceUpdateMany: Attendance.updateMany,
    };
  });

  afterEach(() => {
    GateLog.create = originals.GateLogCreate;
    GateLog.find = originals.GateLogFind;
    GateLog.findOne = originals.GateLogFindOne;
    GateLog.countDocuments = originals.GateLogCountDocuments;
    StudentRfidMapping.find = originals.StudentRfidMappingFind;
    StudentRfidMapping.findOne = originals.StudentRfidMappingFindOne;
    StudentRfidMapping.create = originals.StudentRfidMappingCreate;
    SchoolVehicle.find = originals.SchoolVehicleFind;
    SchoolVehicle.findOne = originals.SchoolVehicleFindOne;
    SchoolVehicle.insertMany = originals.SchoolVehicleInsertMany;
    Student.find = originals.StudentFind;
    Student.findOne = originals.StudentFindOne;
    Attendance.create = originals.AttendanceCreate;
    Attendance.find = originals.AttendanceFind;
    Attendance.findOne = originals.AttendanceFindOne;
    Attendance.updateOne = originals.AttendanceUpdateOne;
    Attendance.updateMany = originals.AttendanceUpdateMany;
  });

  describe('1. Valid RFID Scan & Gate Movement Flow', () => {
    it('should verify student and record physical ENTRY when student was outside', async () => {
      const mockTag = 'RFID-STU-101';

      // Mock mapping lookup
      StudentRfidMapping.findOne = jest.fn().mockResolvedValue({
        _id: new mongoose.Types.ObjectId(),
        schoolId: schoolAId,
        rfidTag: mockTag,
        student: studentAId,
        isActive: true,
      });

      // Mock student query chain
      const mockStudent = {
        _id: studentAId,
        schoolId: schoolAId,
        firstName: 'Rahul',
        lastName: 'Sharma',
        admissionNo: 'ADM-101',
        gender: 'male',
        currentClass: { _id: new mongoose.Types.ObjectId(), name: 'Class 8' },
        currentSection: { _id: new mongoose.Types.ObjectId(), name: 'A' },
      };

      Student.findOne = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            populate: jest.fn().mockResolvedValue(mockStudent),
          }),
        }),
      });

      // Mock last gate log: null (student was outside)
      GateLog.findOne = jest.fn().mockReturnValue({
        sort: jest.fn().mockResolvedValue(null),
      });

      // Mock GateLog creation
      const createdGateLog = {
        _id: new mongoose.Types.ObjectId(),
        schoolId: schoolAId,
        entityType: 'STUDENT',
        eventType: 'ENTRY',
        verificationMethod: 'RFID',
        student: studentAId,
        rfidIdentifier: mockTag,
        gate: 'Main Gate',
        recordedBy: guardUserId,
        timestamp: new Date(),
      };
      GateLog.create = jest.fn().mockResolvedValue(createdGateLog);

      const result = await scanRfid(schoolAId, mockTag, guardUserId, 'Main Gate');

      expect(result.verificationStatus).toBe('VERIFIED');
      expect(result.movement).toBe('ENTRY');
      expect(result.gateState).toBe('INSIDE');
      expect(result.student.firstName).toBe('Rahul');
      expect(result.student.admissionNo).toBe('ADM-101');
      expect(GateLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          schoolId: schoolAId,
          entityType: 'STUDENT',
          eventType: 'ENTRY',
          verificationMethod: 'RFID',
          student: studentAId,
          rfidIdentifier: mockTag,
        })
      );
    });

    it('should determine physical EXIT when student was currently inside', async () => {
      const mockTag = 'RFID-STU-101';

      StudentRfidMapping.findOne = jest.fn().mockResolvedValue({
        _id: new mongoose.Types.ObjectId(),
        schoolId: schoolAId,
        rfidTag: mockTag,
        student: studentAId,
        isActive: true,
      });

      const mockStudent = {
        _id: studentAId,
        schoolId: schoolAId,
        firstName: 'Rahul',
        lastName: 'Sharma',
        admissionNo: 'ADM-101',
        gender: 'male',
      };

      Student.findOne = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            populate: jest.fn().mockResolvedValue(mockStudent),
          }),
        }),
      });

      // Last movement was ENTRY 30 minutes ago (well past 5s debounce)
      const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
      GateLog.findOne = jest.fn().mockReturnValue({
        sort: jest.fn().mockResolvedValue({
          eventType: 'ENTRY',
          timestamp: thirtyMinutesAgo,
        }),
      });

      GateLog.create = jest.fn().mockImplementation((doc) => Promise.resolve({ ...doc, _id: new mongoose.Types.ObjectId() }));

      const result = await scanRfid(schoolAId, mockTag, guardUserId, 'Main Gate');

      expect(result.verificationStatus).toBe('VERIFIED');
      expect(result.movement).toBe('EXIT');
      expect(result.gateState).toBe('OUTSIDE');
      expect(GateLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: 'EXIT',
        })
      );
    });
  });

  describe('2. CRITICAL: Attendance Isolation Test', () => {
    it('MUST NEVER create, update, or modify academic Attendance during RFID scans', async () => {
      const mockTag = 'RFID-STU-101';

      StudentRfidMapping.findOne = jest.fn().mockResolvedValue({
        _id: new mongoose.Types.ObjectId(),
        schoolId: schoolAId,
        rfidTag: mockTag,
        student: studentAId,
        isActive: true,
      });

      Student.findOne = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            populate: jest.fn().mockResolvedValue({
              _id: studentAId,
              schoolId: schoolAId,
              firstName: 'Rahul',
              lastName: 'Sharma',
              admissionNo: 'ADM-101',
            }),
          }),
        }),
      });

      GateLog.findOne = jest.fn().mockReturnValue({
        sort: jest.fn().mockResolvedValue(null),
      });
      GateLog.create = jest.fn().mockImplementation((doc) => Promise.resolve({ ...doc, _id: new mongoose.Types.ObjectId() }));

      // Spies on all Attendance write methods
      const attendanceCreateSpy = jest.fn();
      const attendanceUpdateOneSpy = jest.fn();
      const attendanceUpdateManySpy = jest.fn();
      Attendance.create = attendanceCreateSpy;
      Attendance.updateOne = attendanceUpdateOneSpy;
      Attendance.updateMany = attendanceUpdateManySpy;

      // Perform Mock RFID scan
      await scanRfid(schoolAId, mockTag, guardUserId, 'Main Gate');

      // CRITICAL ASSERTION: Attendance write methods MUST NOT be called at all
      expect(attendanceCreateSpy).not.toHaveBeenCalled();
      expect(attendanceUpdateOneSpy).not.toHaveBeenCalled();
      expect(attendanceUpdateManySpy).not.toHaveBeenCalled();

      // GateLog MUST be created
      expect(GateLog.create).toHaveBeenCalledTimes(1);
      expect(GateLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          entityType: 'STUDENT',
          eventType: 'ENTRY',
          verificationMethod: 'RFID',
        })
      );
    });
  });

  describe('3. Unknown / Invalid RFID Handling', () => {
    it('should throw 404 UNKNOWN_RFID and NOT create a Student master record', async () => {
      StudentRfidMapping.findOne = jest.fn().mockResolvedValue(null);
      Student.create = jest.fn();

      await expect(scanRfid(schoolAId, 'RFID-UNKNOWN-999', guardUserId)).rejects.toThrow(
        "RFID card 'RFID-UNKNOWN-999' is not registered"
      );

      // Verify no student was created
      expect(Student.create).not.toHaveBeenCalled();
    });
  });

  describe('4. Rapid Accidental Duplicate Scan (Debounce Protection)', () => {
    it('should reject scan if previous event was recorded less than 5 seconds ago', async () => {
      const mockTag = 'RFID-STU-101';

      StudentRfidMapping.findOne = jest.fn().mockResolvedValue({
        _id: new mongoose.Types.ObjectId(),
        schoolId: schoolAId,
        rfidTag: mockTag,
        student: studentAId,
        isActive: true,
      });

      Student.findOne = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            populate: jest.fn().mockResolvedValue({
              _id: studentAId,
              schoolId: schoolAId,
              firstName: 'Rahul',
            }),
          }),
        }),
      });

      // Last scan was 2 seconds ago
      const twoSecondsAgo = new Date(Date.now() - 2000);
      GateLog.findOne = jest.fn().mockReturnValue({
        sort: jest.fn().mockResolvedValue({
          eventType: 'ENTRY',
          timestamp: twoSecondsAgo,
        }),
      });

      GateLog.create = jest.fn();

      await expect(scanRfid(schoolAId, mockTag, guardUserId)).rejects.toThrow(
        /SCAN ALREADY RECORDED/
      );

      // Ensure no duplicate GateLog was saved
      expect(GateLog.create).not.toHaveBeenCalled();
    });
  });

  describe('5. Unknown Student Event Logging', () => {
    it('should record an UNKNOWN_STUDENT GateLog without creating a Student master record', async () => {
      GateLog.create = jest.fn().mockImplementation((doc) => Promise.resolve({ ...doc, _id: new mongoose.Types.ObjectId() }));
      Student.create = jest.fn();

      const log = await recordUnknownStudentEvent(
        schoolAId,
        {
          name: 'Unverified Boy',
          approximateClass: 'Grade 6',
          notes: 'Lost ID badge, claims to be in 6B',
          gate: 'Main Gate',
        },
        guardUserId
      );

      expect(log.entityType).toBe('UNKNOWN_STUDENT');
      expect(log.eventType).toBe('ENTRY');
      expect(log.name).toBe('Unverified Boy');
      expect(log.notes).toBe('Lost ID badge, claims to be in 6B');
      expect(Student.create).not.toHaveBeenCalled();
    });
  });

  describe('6. Visitor Entry & Exit Lifecycle', () => {
    it('should record visitor ENTRY with visitorStatus INSIDE and subsequent EXIT with status EXITED', async () => {
      const entryId = new mongoose.Types.ObjectId();
      const visitorEntry = {
        _id: entryId,
        schoolId: schoolAId,
        entityType: 'VISITOR',
        name: 'Anita Desai',
        phone: '9876543210',
        purpose: 'Meeting Principal',
        visitorStatus: 'INSIDE',
        save: jest.fn().mockResolvedValue(true),
      };

      // Entry
      GateLog.create = jest.fn().mockResolvedValue(visitorEntry);
      const entryResult = await recordVisitorEntry(
        schoolAId,
        {
          name: 'Anita Desai',
          phone: '9876543210',
          purpose: 'Meeting Principal',
        },
        guardUserId
      );

      expect(entryResult.name).toBe('Anita Desai');
      expect(entryResult.visitorStatus).toBe('INSIDE');

      // Exit
      GateLog.findOne = jest.fn().mockResolvedValue(visitorEntry);
      GateLog.create = jest.fn().mockImplementation((doc) => Promise.resolve({ ...doc, _id: new mongoose.Types.ObjectId() }));

      const exitResult = await recordVisitorExit(schoolAId, entryId.toString(), guardUserId, 'Meeting concluded');

      expect(visitorEntry.visitorStatus).toBe('EXITED');
      expect(visitorEntry.save).toHaveBeenCalled();
      expect(exitResult.eventType).toBe('EXIT');
      expect(exitResult.entryLogId).toEqual(entryId);
    });
  });

  describe('7. School Van Check-In & Check-Out', () => {
    it('should record vehicle ENTRY and EXIT without transport module coupling', async () => {
      SchoolVehicle.findOne = jest.fn().mockResolvedValue({
        _id: vehicleId,
        schoolId: schoolAId,
        vehicleNumber: 'MH-04-AB-1234',
        type: 'van',
      });

      GateLog.create = jest.fn().mockImplementation((doc) => Promise.resolve({ ...doc, _id: new mongoose.Types.ObjectId() }));

      const checkInResult = await recordVehicleGateEvent(schoolAId, vehicleId, 'ENTRY', guardUserId);
      expect(checkInResult.movement).toBe('ENTRY');
      expect(checkInResult.gateState).toBe('INSIDE');
      expect(checkInResult.vehicle.vehicleNumber).toBe('MH-04-AB-1234');

      const checkOutResult = await recordVehicleGateEvent(schoolAId, vehicleId, 'EXIT', guardUserId);
      expect(checkOutResult.movement).toBe('EXIT');
      expect(checkOutResult.gateState).toBe('OUTSIDE');
    });
  });

  describe('8. Strict Tenant Isolation', () => {
    it('School A guard cannot access or verify School B student RFID mapping', async () => {
      // Mock returns null because mapping belongs to schoolB, but query filters by schoolA
      StudentRfidMapping.findOne = jest.fn().mockResolvedValue(null);

      await expect(scanRfid(schoolAId, 'RFID-SCHOOL-B-TAG', guardUserId)).rejects.toThrow(
        "RFID card 'RFID-SCHOOL-B-TAG' is not registered"
      );

      expect(StudentRfidMapping.findOne).toHaveBeenCalledWith(
        expect.objectContaining({
          schoolId: schoolAId,
        })
      );
    });
  });

  describe('9. Manual Student Search & Minimal Verification Projection', () => {
    it('should search active students and return minimal fields with physical gate state', async () => {
      StudentRfidMapping.findOne = jest.fn().mockResolvedValue(null);

      const mockStudents = [
        {
          _id: studentAId,
          firstName: 'Ananya',
          lastName: 'Patel',
          admissionNo: 'ADM-202',
          gender: 'female',
          currentClass: { name: 'Class 9' },
          currentSection: { name: 'B' },
        },
      ];

      Student.find = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            populate: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue(mockStudents),
            }),
          }),
        }),
      });

      // Student has a previous ENTRY log
      GateLog.findOne = jest.fn().mockReturnValue({
        sort: jest.fn().mockResolvedValue({
          eventType: 'ENTRY',
          timestamp: new Date(),
        }),
      });

      const results = await searchStudents(schoolAId, 'Ananya');
      expect(results).toHaveLength(1);
      expect(results[0].firstName).toBe('Ananya');
      expect(results[0].admissionNo).toBe('ADM-202');
      expect(results[0].currentGateState).toBe('INSIDE');
      // Verify sensitive parent/finance/marks properties are not present
      expect(results[0].marks).toBeUndefined();
      expect(results[0].fees).toBeUndefined();
      expect(results[0].parents).toBeUndefined();
    });
  });

  describe('10. Mock RFID Tag Discovery & Auto-mapping', () => {
    it('should auto-map real active students to mock tags if no mappings exist', async () => {
      // Initially no mappings exist
      StudentRfidMapping.find = jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockResolvedValue([]),
        }),
      });

      const mockStudent = {
        _id: studentAId,
        admissionNo: 'SIS-1001',
        firstName: 'Karan',
        lastName: 'Mehta',
        gender: 'male',
        currentClass: { name: 'Class 10' },
        currentSection: { name: 'A' },
      };

      Student.find = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            populate: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue([mockStudent]),
            }),
          }),
        }),
      });

      StudentRfidMapping.create = jest.fn().mockResolvedValue({
        schoolId: schoolAId,
        rfidTag: 'RFID-STU-SIS1001',
        student: mockStudent,
        isActive: true,
      });

      const tags = await getMockRfidTags(schoolAId);
      expect(tags).toHaveLength(1);
      expect(tags[0].rfidTag).toBe('RFID-STU-SIS1001');
      expect(tags[0].student.firstName).toBe('Karan');
    });
  });

  describe('11. Operational Summary Metrics Calculation', () => {
    it('should accurately aggregate real database values for gate summary', async () => {
      GateLog.countDocuments = jest
        .fn()
        .mockResolvedValueOnce(42) // todayEventsCount
        .mockResolvedValueOnce(3)  // visitorsInside
        .mockResolvedValueOnce(25); // studentsEnteredToday

      SchoolVehicle.find = jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue([{ _id: vehicleId }]),
      });

      GateLog.findOne = jest.fn().mockReturnValue({
        sort: jest.fn().mockResolvedValue({ eventType: 'ENTRY' }),
      });

      GateLog.find = jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            populate: jest.fn().mockReturnValue({
              populate: jest.fn().mockReturnValue({
                populate: jest.fn().mockResolvedValue([]),
              }),
            }),
          }),
        }),
      });

      const summary = await getGateSummary(schoolAId);
      expect(summary.metrics.todayEventsCount).toBe(42);
      expect(summary.metrics.visitorsInside).toBe(3);
      expect(summary.metrics.vansInside).toBe(1);
      expect(summary.metrics.studentsEnteredToday).toBe(25);
      expect(summary.gateName).toBe('Main Gate');
    });
  });
});
