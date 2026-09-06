import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import mongoose from 'mongoose';
import {
  createLeave,
  approveLeaveWithAssignments,
  rejectLeave,
  getLeaves,
  cancelLeave,
  determineClassTeacher,
} from '../leave.service.js';
import Leave from '../../models/Leave.js';
import User from '../../models/User.js';
import Student from '../../models/Student.js';
import Parent from '../../models/Parent.js';
import Teacher from '../../models/Teacher.js';
import SchoolClass from '../../models/SchoolClass.js';
import Attendance from '../../models/Attendance.js';
import AuditLog from '../../models/AuditLog.js';
import Notification from '../../models/Notification.js';
import Setting from '../../models/Setting.js';

describe('Student Leave Management Workflow & Security Tests', () => {
  const schoolA = new mongoose.Types.ObjectId().toString();
  const schoolB = new mongoose.Types.ObjectId().toString();

  const parentUserId = new mongoose.Types.ObjectId().toString();
  const otherParentUserId = new mongoose.Types.ObjectId().toString();
  const parentProfileId = new mongoose.Types.ObjectId().toString();

  const teacherAUserId = new mongoose.Types.ObjectId().toString();
  const teacherAProfileId = new mongoose.Types.ObjectId().toString();

  const teacherBUserId = new mongoose.Types.ObjectId().toString();
  const teacherBProfileId = new mongoose.Types.ObjectId().toString();

  const class8AId = new mongoose.Types.ObjectId().toString();
  const section8AId = new mongoose.Types.ObjectId().toString();
  const class8BId = new mongoose.Types.ObjectId().toString();

  const studentAId = new mongoose.Types.ObjectId().toString();
  const studentBId = new mongoose.Types.ObjectId().toString();
  const studentSchoolBId = new mongoose.Types.ObjectId().toString();

  let notificationsSent = [];
  let auditLogsCreated = [];

  // Model backups
  let originals = {};

  beforeEach(() => {
    notificationsSent = [];
    auditLogsCreated = [];

    originals = {
      UserFindById: User.findById,
      UserFindOne: User.findOne,
      UserFind: User.find,
      ParentFindOne: Parent.findOne,
      StudentFindOne: Student.findOne,
      StudentFind: Student.find,
      TeacherFindOne: Teacher.findOne,
      SchoolClassFindOne: SchoolClass.findOne,
      LeaveCreate: Leave.create,
      LeaveFindOne: Leave.findOne,
      LeaveFindOneAndUpdate: Leave.findOneAndUpdate,
      LeaveFind: Leave.find,
      AttendanceFind: Attendance.find,
      AttendanceFindOne: Attendance.findOne,
      NotificationCreate: Notification.create,
      NotificationInsertMany: Notification.insertMany,
      AuditLogCreate: AuditLog.create,
      SettingFindOne: Setting.findOne,
    };

    // Default safe mocks for all queries
    SchoolClass.findOne = async () => null;
    Student.findOne = () => ({ populate: () => ({ populate: async () => null }) });
    Teacher.findOne = async () => null;
    User.find = () => ({ select: async () => [] });
    Setting.findOne = async () => null;

    // Notification spy
    Notification.create = async (doc) => {
      notificationsSent.push(doc);
      return { _id: new mongoose.Types.ObjectId(), ...doc };
    };
    Notification.insertMany = async (docs) => {
      notificationsSent.push(...docs);
      return docs;
    };

    // AuditLog spy
    AuditLog.create = async (doc) => {
      auditLogsCreated.push(doc);
      return { _id: new mongoose.Types.ObjectId(), ...doc };
    };
  });

  afterEach(() => {
    User.findById = originals.UserFindById;
    User.findOne = originals.UserFindOne;
    User.find = originals.UserFind;
    Parent.findOne = originals.ParentFindOne;
    Student.findOne = originals.StudentFindOne;
    Student.find = originals.StudentFind;
    Teacher.findOne = originals.TeacherFindOne;
    SchoolClass.findOne = originals.SchoolClassFindOne;
    Leave.create = originals.LeaveCreate;
    Leave.findOne = originals.LeaveFindOne;
    Leave.findOneAndUpdate = originals.LeaveFindOneAndUpdate;
    Leave.find = originals.LeaveFind;
    Attendance.find = originals.AttendanceFind;
    Attendance.findOne = originals.AttendanceFindOne;
    Notification.create = originals.NotificationCreate;
    Notification.insertMany = originals.NotificationInsertMany;
    AuditLog.create = originals.AuditLogCreate;
    Setting.findOne = originals.SettingFindOne;
  });

  // Helper mocks
  const mockParentUser = () => {
    User.findById = async (id) => {
      if (id.toString() === parentUserId) {
        return {
          _id: parentUserId,
          role: 'parent',
          profileId: parentProfileId,
          profileModel: 'Parent',
          schoolId: schoolA,
          name: 'Raj Sharma',
        };
      }
      return null;
    };

    Parent.findOne = async () => ({
      _id: parentProfileId,
      schoolId: schoolA,
      firstName: 'Raj',
      lastName: 'Sharma',
      students: [studentAId],
    });
  };

  const mockTeacherUserA = () => {
    User.findById = async (id) => {
      if (id.toString() === teacherAUserId) {
        return {
          _id: teacherAUserId,
          role: 'teacher',
          profileId: teacherAProfileId,
          profileModel: 'Teacher',
          schoolId: schoolA,
          name: 'Priya Patel',
        };
      }
      return null;
    };

    Teacher.findOne = async (query) => {
      if (query._id?.toString() === teacherAProfileId || query['contact.email'] === 'priya@test.com') {
        return {
          _id: teacherAProfileId,
          schoolId: schoolA,
          firstName: 'Priya',
          lastName: 'Patel',
          isClassTeacher: true,
          classTeacherOf: class8AId,
          classTeacherSection: section8AId,
        };
      }
      return null;
    };
  };

  const mockTeacherUserB = () => {
    User.findById = async (id) => {
      if (id.toString() === teacherBUserId) {
        return {
          _id: teacherBUserId,
          role: 'teacher',
          profileId: teacherBProfileId,
          profileModel: 'Teacher',
          schoolId: schoolA,
          name: 'Amit Singh',
        };
      }
      return null;
    };

    Teacher.findOne = async (query) => {
      if (query._id?.toString() === teacherBProfileId) {
        return {
          _id: teacherBProfileId,
          schoolId: schoolA,
          firstName: 'Amit',
          lastName: 'Singh',
          isClassTeacher: true,
          classTeacherOf: class8BId,
        };
      }
      return null;
    };
  };

  // 1. Parent creates leave for own child -> allowed
  it('1. should allow parent to create leave for own child and route to class teacher', async () => {
    mockParentUser();

    Student.findOne = () => ({
      populate: () => ({
        populate: async () => ({
          _id: studentAId,
          firstName: 'Aarav',
          lastName: 'Sharma',
          currentClass: { _id: class8AId, name: 'Grade 8' },
          currentSection: { _id: section8AId, name: 'A' },
          schoolId: schoolA,
          status: 'active',
        }),
      }),
    });

    Leave.findOne = async () => null; // no overlap
    Teacher.findOne = async () => ({
      _id: teacherAProfileId,
      firstName: 'Priya',
      lastName: 'Patel',
      schoolId: schoolA,
    });
    User.findOne = async () => ({
      _id: teacherAUserId,
      role: 'teacher',
      email: 'priya@test.com',
    });

    let createdData = null;
    Leave.create = async (data) => {
      createdData = data;
      return { _id: 'leave-1', ...data };
    };

    const result = await createLeave(
      schoolA,
      {
        studentId: studentAId,
        type: 'sick',
        startDate: '2026-09-10',
        endDate: '2026-09-12',
        reason: 'Viral Fever',
      },
      parentUserId
    );

    expect(result).toBeDefined();
    expect(createdData.requesterModel).toBe('Student');
    expect(createdData.student.toString()).toBe(studentAId);
    expect(createdData.approverTeacher.toString()).toBe(teacherAProfileId);
    expect(createdData.status).toBe('pending');
    expect(notificationsSent.length).toBeGreaterThan(0);
    expect(auditLogsCreated.some((a) => a.action === 'STUDENT_LEAVE_REQUESTED')).toBe(true);
  });

  // 2. Parent creates leave for another parent's child -> denied (403)
  it("2. should deny parent creating leave for another parent's child", async () => {
    mockParentUser();

    await expect(
      createLeave(
        schoolA,
        {
          studentId: studentBId, // not in parent.students
          type: 'sick',
          startDate: '2026-09-10',
          endDate: '2026-09-12',
          reason: 'Fever',
        },
        parentUserId
      )
    ).rejects.toThrow('You are not authorized to submit leave for this student');
  });

  // 3. Parent creates leave using another school's studentId -> denied (404)
  it("3. should deny leave creation if student belongs to another school", async () => {
    mockParentUser();

    // Student belongs to schoolB
    Student.findOne = () => ({
      populate: () => ({
        populate: async () => null, // student not found in schoolA
      }),
    });

    await expect(
      createLeave(
        schoolA,
        {
          studentId: studentAId,
          type: 'sick',
          startDate: '2026-09-10',
          endDate: '2026-09-12',
          reason: 'Fever',
        },
        parentUserId
      )
    ).rejects.toThrow('Student not found in your school');
  });

  // 4. Parent attempts status=APPROVED in payload -> ignored / forced to PENDING
  it('4. should ignore client-supplied status and force status to PENDING', async () => {
    mockParentUser();

    Student.findOne = () => ({
      populate: () => ({
        populate: async () => ({
          _id: studentAId,
          firstName: 'Aarav',
          lastName: 'Sharma',
          currentClass: { _id: class8AId, name: 'Grade 8' },
          currentSection: { _id: section8AId, name: 'A' },
          schoolId: schoolA,
          status: 'active',
        }),
      }),
    });

    Leave.findOne = async () => null;
    Teacher.findOne = async () => ({ _id: teacherAProfileId, schoolId: schoolA });
    User.findOne = async () => ({ _id: teacherAUserId, role: 'teacher' });

    let createdData = null;
    Leave.create = async (data) => {
      createdData = data;
      return { _id: 'leave-1', ...data };
    };

    await createLeave(
      schoolA,
      {
        studentId: studentAId,
        type: 'sick',
        startDate: '2026-09-10',
        endDate: '2026-09-12',
        reason: 'Fever',
        status: 'approved', // malicious attempt
      },
      parentUserId
    );

    expect(createdData.status).toBe('pending');
  });

  // 5. No class teacher assigned -> graceful rejection and school admin alert
  it('5. should reject leave creation if no class teacher is assigned and notify school admins', async () => {
    mockParentUser();

    Student.findOne = () => ({
      populate: () => ({
        populate: async () => ({
          _id: studentAId,
          firstName: 'Aarav',
          lastName: 'Sharma',
          currentClass: { _id: class8AId, name: 'Grade 8' },
          currentSection: { _id: section8AId, name: 'A' },
          schoolId: schoolA,
          status: 'active',
        }),
      }),
    });

    Leave.findOne = async () => null;
    Teacher.findOne = async () => null; // No class teacher!
    SchoolClass.findOne = async () => ({ _id: class8AId, name: 'Grade 8', classTeacher: null });
    User.find = async () => [{ _id: 'admin-1' }]; // school admin

    await expect(
      createLeave(
        schoolA,
        {
          studentId: studentAId,
          type: 'sick',
          startDate: '2026-09-10',
          endDate: '2026-09-12',
          reason: 'Fever',
        },
        parentUserId
      )
    ).rejects.toThrow('Leave cannot be submitted because a class teacher has not been assigned');

    expect(notificationsSent.some((n) => n.title === 'Unassigned Class Teacher Alert')).toBe(true);
  });

  // 6. Overlapping leave request -> 409 conflict
  it('6. should reject overlapping leave request with 409 Conflict', async () => {
    mockParentUser();

    Student.findOne = () => ({
      populate: () => ({
        populate: async () => ({
          _id: studentAId,
          firstName: 'Aarav',
          lastName: 'Sharma',
          currentClass: { _id: class8AId },
          schoolId: schoolA,
          status: 'active',
        }),
      }),
    });

    // Overlap exists
    Leave.findOne = async () => ({ _id: 'existing-leave', status: 'pending' });

    await expect(
      createLeave(
        schoolA,
        {
          studentId: studentAId,
          type: 'sick',
          startDate: '2026-09-11',
          endDate: '2026-09-13',
          reason: 'Cold',
        },
        parentUserId
      )
    ).rejects.toThrow('An overlapping leave request already exists for this student');
  });

  // 7. Teacher attempts to approve unrelated student's leave -> denied (403)
  it("7. should deny Teacher B from approving Student A's leave (different class/section)", async () => {
    mockTeacherUserB();

    Leave.findOne = async () => ({
      _id: 'leave-1',
      schoolId: schoolA,
      status: 'pending',
      requester: parentUserId,
      requesterModel: 'Student',
      student: studentAId,
      approverTeacher: teacherAProfileId, // Assigned to Teacher A, not Teacher B!
    });

    Student.findOne = async () => ({
      _id: studentAId,
      currentClass: class8AId,
      schoolId: schoolA,
    });

    Teacher.findOne = async (query) => {
      if (query._id?.toString() === teacherBProfileId) {
        return {
          _id: teacherBProfileId,
          schoolId: schoolA,
          firstName: 'Amit',
          lastName: 'Singh',
          isClassTeacher: true,
          classTeacherOf: class8BId,
        };
      }
      return null;
    };

    await expect(
      approveLeaveWithAssignments('leave-1', schoolA, [], teacherBUserId)
    ).rejects.toThrow('You are not authorized to approve leave for this student');
  });

  // 8. Teacher attempts to reject unrelated student's leave -> denied (403)
  it("8. should deny Teacher B from rejecting Student A's leave", async () => {
    mockTeacherUserB();

    Leave.findOne = async () => ({
      _id: 'leave-1',
      schoolId: schoolA,
      status: 'pending',
      requester: parentUserId,
      requesterModel: 'Student',
      student: studentAId,
      approverTeacher: teacherAProfileId,
    });

    Student.findOne = async () => ({
      _id: studentAId,
      currentClass: class8AId,
      schoolId: schoolA,
    });

    Teacher.findOne = async (query) => {
      if (query._id?.toString() === teacherBProfileId) {
        return {
          _id: teacherBProfileId,
          schoolId: schoolA,
          firstName: 'Amit',
          lastName: 'Singh',
          isClassTeacher: true,
          classTeacherOf: class8BId,
        };
      }
      return null;
    };

    await expect(
      rejectLeave('leave-1', schoolA, 'Cannot approve this', teacherBUserId)
    ).rejects.toThrow('You are not authorized to reject leave for this student');
  });

  // 9. Assigned class teacher approves student's pending leave -> allowed & attendance updated
  it("9. should allow assigned Class Teacher A to approve Student A's leave and update attendance", async () => {
    mockTeacherUserA();

    Leave.findOne = async () => ({
      _id: 'leave-1',
      schoolId: schoolA,
      status: 'pending',
      requester: parentUserId,
      requesterModel: 'Student',
      student: studentAId,
      approverTeacher: teacherAProfileId,
      startDate: new Date('2026-09-10'),
      endDate: new Date('2026-09-12'),
    });

    Leave.findOneAndUpdate = () => ({
      populate: async () => ({
        _id: 'leave-1',
        schoolId: schoolA,
        status: 'approved',
        requester: parentUserId,
        requesterModel: 'Student',
        student: {
          _id: studentAId,
          firstName: 'Aarav',
          lastName: 'Sharma',
          currentClass: class8AId,
          currentSection: section8AId,
        },
        startDate: new Date('2026-09-10'),
        endDate: new Date('2026-09-12'),
        approvedBy: teacherAUserId,
        approvedAt: new Date(),
      }),
    });

    // Attendance record to be updated
    let attendanceSaved = false;
    Attendance.find = async () => [
      {
        schoolId: schoolA,
        schoolClass: class8AId,
        section: section8AId,
        date: new Date('2026-09-10'),
        students: [{ student: studentAId, status: 'absent' }],
        summary: { present: 0, absent: 1, late: 0, leave: 0, total: 1 },
        save: async function () {
          attendanceSaved = true;
          return this;
        },
      },
    ];

    const result = await approveLeaveWithAssignments('leave-1', schoolA, [], teacherAUserId);

    expect(result.leave).toBeDefined();
    expect(result.leave.status).toBe('approved');
    expect(attendanceSaved).toBe(true);
    expect(notificationsSent.some((n) => n.title === 'Student Leave Approved')).toBe(true);
    expect(auditLogsCreated.some((a) => a.action === 'STUDENT_LEAVE_APPROVED')).toBe(true);
  });

  // 10. Teacher approves already-approved leave -> denied (409)
  it('10. should deny approving an already approved leave request with 409 Conflict', async () => {
    mockTeacherUserA();

    Leave.findOne = async () => ({
      _id: 'leave-1',
      schoolId: schoolA,
      status: 'approved', // already approved
      requester: parentUserId,
      requesterModel: 'Student',
      student: studentAId,
      approverTeacher: teacherAProfileId,
    });

    await expect(
      approveLeaveWithAssignments('leave-1', schoolA, [], teacherAUserId)
    ).rejects.toThrow('Leave request is no longer pending (current status: approved)');
  });

  // 11. Teacher rejects already-rejected leave -> denied (409)
  it('11. should deny rejecting an already rejected leave request with 409 Conflict', async () => {
    mockTeacherUserA();

    Leave.findOne = async () => ({
      _id: 'leave-1',
      schoolId: schoolA,
      status: 'rejected', // already rejected
      requester: parentUserId,
      requesterModel: 'Student',
      student: studentAId,
      approverTeacher: teacherAProfileId,
    });

    await expect(
      rejectLeave('leave-1', schoolA, 'Invalid medical slip', teacherAUserId)
    ).rejects.toThrow('Leave request is no longer pending (current status: rejected)');
  });

  // 12. Cross-school approval -> denied
  it('12. should deny leave approval from another school (tenant isolation)', async () => {
    mockTeacherUserA();

    // Query with schoolB: leave not found in schoolB
    Leave.findOne = async () => null;

    await expect(
      approveLeaveWithAssignments('leave-1', schoolB, [], teacherAUserId)
    ).rejects.toThrow('Leave request not found');
  });

  // 13. Invalid leave ID -> 404 response
  it('13. should throw 404 when leave ID does not exist', async () => {
    mockTeacherUserA();
    Leave.findOne = async () => null;

    await expect(
      approveLeaveWithAssignments('non-existent-id', schoolA, [], teacherAUserId)
    ).rejects.toThrow('Leave request not found');
  });

  // 14. Rejection requires a reason
  it('14. should require rejectionReason when rejecting leave', async () => {
    await expect(
      rejectLeave('leave-1', schoolA, '', teacherAUserId)
    ).rejects.toThrow('Rejection reason is required');
  });

  // 15. Class teacher correctly rejects student leave with reason
  it("15. should allow Class Teacher A to reject Student A's leave and notify parent with reason", async () => {
    mockTeacherUserA();

    Leave.findOne = async () => ({
      _id: 'leave-1',
      schoolId: schoolA,
      status: 'pending',
      requester: parentUserId,
      requesterModel: 'Student',
      student: studentAId,
      approverTeacher: teacherAProfileId,
    });

    Leave.findOneAndUpdate = () => ({
      populate: async () => ({
        _id: 'leave-1',
        schoolId: schoolA,
        status: 'rejected',
        requester: parentUserId,
        requesterModel: 'Student',
        student: { _id: studentAId, firstName: 'Aarav', lastName: 'Sharma' },
        rejectedBy: teacherAUserId,
        rejectedAt: new Date(),
        rejectionReason: 'Exams scheduled on these dates',
      }),
    });

    const result = await rejectLeave('leave-1', schoolA, 'Exams scheduled on these dates', teacherAUserId);

    expect(result.status).toBe('rejected');
    expect(result.rejectionReason).toBe('Exams scheduled on these dates');
    expect(notificationsSent.some((n) => n.title === 'Student Leave Rejected')).toBe(true);
    expect(auditLogsCreated.some((a) => a.action === 'STUDENT_LEAVE_REJECTED')).toBe(true);
  });

  // 16. Parent can cancel pending leave
  it('16. should allow parent to cancel pending leave for their child', async () => {
    mockParentUser();

    Leave.findOne = async () => ({
      _id: 'leave-1',
      schoolId: schoolA,
      status: 'pending',
      requester: parentUserId,
      requesterModel: 'Student',
      student: studentAId,
      auditTrail: [],
      save: async function () { return this; },
    });

    const result = await cancelLeave('leave-1', schoolA, parentUserId, 'Family trip postponed');
    expect(result.status).toBe('cancelled');
    expect(auditLogsCreated.some((a) => a.action === 'STUDENT_LEAVE_CANCELLED')).toBe(true);
  });

  // 17. Settings enforcement: maxConsecutiveDays
  it('17. should reject student leave if duration exceeds maxConsecutiveDays from settings', async () => {
    mockParentUser();

    Student.findOne = () => ({
      populate: () => ({
        populate: async () => ({
          _id: studentAId,
          schoolId: schoolA,
          firstName: 'Aarav',
          lastName: 'Sharma',
          currentClass: { _id: class8AId, name: 'Grade 8' },
          currentSection: { _id: section8AId, name: 'A' },
        }),
      }),
    });

    Leave.findOne = async () => null;

    Setting.findOne = async () => ({
      leave: {
        studentLeave: {
          maxConsecutiveDays: 5,
        },
      },
    });

    // 10 days leave
    await expect(
      createLeave(schoolA, {
        studentId: studentAId,
        startDate: '2026-10-01',
        endDate: '2026-10-10',
        reason: 'Long vacation',
      }, parentUserId)
    ).rejects.toThrow('exceeds maximum allowed limit of 5 days');
  });

  // 18. Settings enforcement: requireMedicalCertificateDays
  it('18. should require medical certificate when leave duration reaches threshold in settings', async () => {
    mockParentUser();

    Student.findOne = () => ({
      populate: () => ({
        populate: async () => ({
          _id: studentAId,
          schoolId: schoolA,
          firstName: 'Aarav',
          lastName: 'Sharma',
          currentClass: { _id: class8AId, name: 'Grade 8' },
          currentSection: { _id: section8AId, name: 'A' },
        }),
      }),
    });

    Leave.findOne = async () => null;

    Setting.findOne = async () => ({
      leave: {
        studentLeave: {
          maxConsecutiveDays: 15,
          requireMedicalCertificateDays: 3,
        },
      },
    });

    // 4 days leave without document
    await expect(
      createLeave(schoolA, {
        studentId: studentAId,
        startDate: '2026-10-01',
        endDate: '2026-10-04',
        reason: 'Severe illness',
      }, parentUserId)
    ).rejects.toThrow('medical certificate is required for student leaves of 3 days or more');
  });
});
