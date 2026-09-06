import mongoose from 'mongoose';
import Leave from '../models/Leave.js';
import User from '../models/User.js';
import Substitution from '../models/Substitution.js';
import Timetable from '../models/Timetable.js';
import TimetableConfig from '../models/TimetableConfig.js';
import Teacher from '../models/Teacher.js';
import Student from '../models/Student.js';
import Parent from '../models/Parent.js';
import SchoolClass from '../models/SchoolClass.js';
import ApiError from '../utils/ApiError.js';
import Setting from '../models/Setting.js';
import { paginate } from '../utils/pagination.js';
import { createNotification, sendBulkNotification } from './notification.service.js';
import { createAuditLog } from './audit.service.js';
import { applyApprovedLeaveToAttendance } from './attendance.service.js';
import { getParentForUser } from './parent.service.js';
import {
  timesOverlap,
  timeToMinutes,
  resolvePeriodTimes,
  getEligibleTeachersForLectureSlot,
  cancelSubstitution,
} from './substitution.service.js';

/**
 * Determine the assigned class teacher for a student
 */
export const determineClassTeacher = async (schoolId, student) => {
  if (!student || !student.currentClass) return null;

  const classId = student.currentClass?._id || student.currentClass;
  const sectionId = student.currentSection?._id || student.currentSection;

  // 1. If student has a section, look for teacher assigned as class teacher of that specific section
  if (sectionId) {
    const sectionTeacher = await Teacher.findOne({
      schoolId,
      status: 'active',
      isClassTeacher: true,
      classTeacherOf: classId,
      classTeacherSection: sectionId,
    });
    if (sectionTeacher) return sectionTeacher;
  }

  // 2. Look for teacher assigned to the class with no specific section constraint
  const classTeacher = await Teacher.findOne({
    schoolId,
    status: 'active',
    isClassTeacher: true,
    classTeacherOf: classId,
    $or: [{ classTeacherSection: null }, { classTeacherSection: { $exists: false } }],
  });
  if (classTeacher) return classTeacher;

  // 3. Fallback: Check SchoolClass model's classTeacher reference
  const schoolClass = await SchoolClass.findOne({ _id: classId, schoolId });
  if (schoolClass?.classTeacher) {
    const teacherFromClass = await Teacher.findOne({
      _id: schoolClass.classTeacher,
      schoolId,
      status: 'active',
    });
    if (teacherFromClass) return teacherFromClass;
  }

  return null;
};

/**
 * Find teacher model matching the requester user
 */
const findTeacherForUser = async (schoolId, user) => {
  if (!user) return null;

  // 1. Direct match by profileId if profileModel is Teacher
  if (user.profileId) {
    const teacherByProfile = await Teacher.findOne({ _id: user.profileId, schoolId });
    if (teacherByProfile) return teacherByProfile;
  }

  // 2. Query by email or profileId
  let teacher = await Teacher.findOne({
    schoolId,
    $or: [
      { 'contact.email': user.email },
      { email: user.email },
      { _id: user.profileId },
    ],
  });

  // 3. Fallback: match by name
  if (!teacher && user.name) {
    const parts = user.name.split(' ');
    teacher = await Teacher.findOne({
      schoolId,
      firstName: parts[0],
      lastName: parts.slice(1).join(' ') || parts[0],
    });
  }

  return teacher;
};

/**
 * Identify all affected timetable lectures for a pending/approved leave AND pre-calculate available free teachers for each slot
 */
export const getAffectedLectures = async (leaveId, schoolId) => {
  const leave = await Leave.findOne({ _id: leaveId, schoolId }).populate('requester', 'name email role profileId profileModel');
  if (!leave) throw new ApiError(404, 'Leave request not found');

  if (leave.requesterModel !== 'Teacher') {
    return { leave, affectedLectures: [] };
  }

  const teacher = await findTeacherForUser(schoolId, leave.requester);
  if (!teacher) {
    console.log(`[LeaveService] No teacher model linked for user ${leave.requester?.name || leave.requester}`);
    return { leave, affectedLectures: [] };
  }

  const start = new Date(leave.startDate);
  start.setHours(0, 0, 0, 0);

  const end = new Date(leave.endDate);
  end.setHours(23, 59, 59, 999);

  // Fetch school TimetableConfig to resolve default period times if missing
  const config = await TimetableConfig.findOne({ schoolId });

  // Fetch all published timetables for this school
  const timetables = await Timetable.find({ schoolId, status: 'published' })
    .populate('schoolClass', 'name')
    .populate('section', 'name')
    .populate('periods.subject', 'name code');

  const affectedLectures = [];

  const current = new Date(start);
  while (current <= end) {
    const dayOfWeek = current.getDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat
    const dateNormalized = new Date(current);
    dateNormalized.setHours(0, 0, 0, 0);
    const dateStr = dateNormalized.toISOString().split('T')[0];

    for (const tt of timetables) {
      for (const period of tt.periods || []) {
        if (!period.teacher || period.teacher.toString() !== teacher._id.toString()) continue;
        if (period.day !== dayOfWeek) continue;
        if (period.isLunch || period.isBreak || period.isAssembly) continue;

        // Resolve exact start & end times for this period
        const { startTime, endTime } = resolvePeriodTimes(period, config);

        // Check partial day overlap if specified
        if (leave.isPartialDay && leave.startTime && leave.endTime) {
          if (!timesOverlap(startTime, endTime, leave.startTime, leave.endTime)) {
            continue;
          }
        }

        const lectureKey = `${dateStr}_P${period.periodNo}_${tt._id}`;

        // Pre-calculate FREE & BUSY teachers for this exact slot
        const { freeTeachers, busyTeachers } = await getEligibleTeachersForLectureSlot(schoolId, {
          date: dateNormalized,
          day: dayOfWeek,
          startTime,
          endTime,
          periodNo: period.periodNo,
          originalTeacherId: teacher._id,
          subjectId: period.subject?._id || period.subject,
          classId: tt.schoolClass?._id || tt.schoolClass,
        });

        affectedLectures.push({
          lectureKey,
          timetableId: tt._id,
          date: dateNormalized,
          day: dayOfWeek,
          periodNo: period.periodNo,
          startTime,
          endTime,
          subject: period.subject,
          schoolClass: tt.schoolClass,
          section: tt.section,
          room: period.room,
          originalTeacher: {
            _id: teacher._id,
            firstName: teacher.firstName,
            lastName: teacher.lastName,
            department: teacher.department,
          },
          freeTeachers,
          busyTeachers,
        });
      }
    }

    current.setDate(current.getDate() + 1);
  }

  // Sort by date then periodNo
  affectedLectures.sort((a, b) => a.date - b.date || a.periodNo - b.periodNo);

  console.log(`[LeaveService] Leave ID: ${leaveId} (${teacher.firstName} ${teacher.lastName}) -> Total Affected Lectures: ${affectedLectures.length}`);

  return {
    leave,
    teacher: {
      _id: teacher._id,
      firstName: teacher.firstName,
      lastName: teacher.lastName,
      department: teacher.department,
    },
    affectedLectures,
  };
};

/**
 * Create a new leave application
 */
export const createLeave = async (schoolId, data, userId) => {
  const startDate = new Date(data.startDate);
  const endDate = new Date(data.endDate);

  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    throw new ApiError(400, 'Invalid start or end date');
  }

  if (startDate > endDate) {
    throw new ApiError(400, 'Start date cannot be after end date');
  }

  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, 'User not found');

  // --- STUDENT LEAVE (SUBMITTED BY PARENT) ---
  if (user.role === 'parent' || data.studentId) {
    if (!data.studentId) {
      throw new ApiError(400, 'Child (studentId) is required to apply for student leave');
    }

    const parent = await getParentForUser(user, schoolId);
    const isChildOfParent = parent.students?.some((id) => id.toString() === data.studentId.toString());
    if (!isChildOfParent) {
      throw new ApiError(403, 'You are not authorized to submit leave for this student');
    }

    const student = await Student.findOne({
      _id: data.studentId,
      schoolId,
      status: { $in: ['active', 'promoted'] },
    }).populate('currentClass').populate('currentSection');

    if (!student) {
      throw new ApiError(404, 'Student not found in your school');
    }

    // Check for overlapping pending or approved leave requests for this student
    const overlap = await Leave.findOne({
      schoolId,
      student: student._id,
      status: { $in: ['pending', 'approved'] },
      $or: [
        { startDate: { $lte: endDate }, endDate: { $gte: startDate } },
      ],
    });

    if (overlap) {
      throw new ApiError(409, 'An overlapping leave request already exists for this student.');
    }

    // Validate against School Leave Policies
    const schoolSettings = await Setting.findOne({ schoolId });
    const studentPolicy = schoolSettings?.leave?.studentLeave;
    const durationDays = Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    if (studentPolicy?.maxConsecutiveDays && durationDays > studentPolicy.maxConsecutiveDays) {
      throw new ApiError(400, `Student leave duration (${durationDays} days) exceeds maximum allowed limit of ${studentPolicy.maxConsecutiveDays} days.`);
    }

    if (studentPolicy?.requireMedicalCertificateDays && durationDays >= studentPolicy.requireMedicalCertificateDays && !data.document) {
      throw new ApiError(400, `A medical certificate is required for student leaves of ${studentPolicy.requireMedicalCertificateDays} days or more.`);
    }

    // Determine student's class teacher
    const classTeacher = await determineClassTeacher(schoolId, student);
    if (!classTeacher) {
      // Notify school administrators about unassigned class teacher
      const adminQuery = User.find({ schoolId, role: 'school_admin' });
      const schoolAdmins = typeof adminQuery?.select === 'function'
        ? await adminQuery.select('_id')
        : await adminQuery;
      if (schoolAdmins && schoolAdmins.length > 0) {
        await sendBulkNotification(
          schoolId,
          schoolAdmins.map((a) => a._id),
          'Unassigned Class Teacher Alert',
          `A leave request for student ${student.firstName} ${student.lastName} could not be submitted because no class teacher is assigned to their class.`,
          'leave_update'
        );
      }
      throw new ApiError(400, 'Leave cannot be submitted because a class teacher has not been assigned. Please contact the school administrator.');
    }

    const leaveType = data.type || data.leaveType || 'sick';

    const leave = await Leave.create({
      schoolId,
      requester: userId,
      requesterModel: 'Student',
      student: student._id,
      parent: parent._id,
      approverTeacher: classTeacher._id,
      type: leaveType,
      startDate,
      endDate,
      isPartialDay: Boolean(data.isPartialDay),
      startTime: data.startTime || undefined,
      endTime: data.endTime || undefined,
      reason: data.reason,
      document: data.document || undefined,
      status: 'pending', // Always force pending
      auditTrail: [{
        actor: userId,
        action: 'STUDENT_LEAVE_REQUESTED',
        notes: `Applied for ${leaveType} leave for ${student.firstName} ${student.lastName} (${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]})`,
      }],
    });

    // Notify assigned class teacher
    const teacherUser = await User.findOne({
      schoolId,
      role: 'teacher',
      $or: [
        { profileId: classTeacher._id },
        ...(classTeacher.contact?.email ? [{ email: classTeacher.contact.email.toLowerCase().trim() }] : []),
      ],
    });

    if (teacherUser) {
      await createNotification(schoolId, {
        recipient: teacherUser._id,
        type: 'leave_update',
        title: 'New Student Leave Request',
        message: `${parent.firstName || user.name} has submitted a ${leave.type} leave request for ${student.firstName} ${student.lastName} (${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}).`,
        data: { leaveId: leave._id, studentId: student._id },
      });
    }

    // Create Audit Log
    await createAuditLog({
      schoolId,
      actor: userId,
      action: 'STUDENT_LEAVE_REQUESTED',
      entity: 'Leave',
      entityId: leave._id,
      after: {
        studentId: student._id,
        parentId: parent._id,
        approverTeacherId: classTeacher._id,
        type: leaveType,
        startDate,
        endDate,
        reason: data.reason,
      },
    });

    return leave;
  }

  // --- TEACHER / USER LEAVE ---
  // Check for overlapping pending or approved leave requests for this user
  const overlap = await Leave.findOne({
    schoolId,
    requester: userId,
    status: { $in: ['pending', 'approved'] },
    $or: [
      { startDate: { $lte: endDate }, endDate: { $gte: startDate } },
    ],
  });

  if (overlap) {
    throw new ApiError(409, 'Leave request overlaps with an existing pending or approved leave');
  }

  // Validate against School Leave Policies
  const schoolSettingsForTeacher = await Setting.findOne({ schoolId });
  const teacherPolicy = schoolSettingsForTeacher?.leave?.teacherLeave;
  const teacherDurationDays = Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

  if (teacherPolicy?.maxConsecutiveDays && teacherDurationDays > teacherPolicy.maxConsecutiveDays) {
    throw new ApiError(400, `Teacher leave duration (${teacherDurationDays} days) exceeds maximum allowed limit of ${teacherPolicy.maxConsecutiveDays} days.`);
  }

  const requesterModel = user.role === 'teacher' ? 'Teacher' : 'Student';

  const leave = await Leave.create({
    ...data,
    schoolId,
    requester: userId,
    requesterModel,
    type: data.type || data.leaveType || 'sick',
    startDate,
    endDate,
    isPartialDay: Boolean(data.isPartialDay),
    startTime: data.startTime || undefined,
    endTime: data.endTime || undefined,
    reason: data.reason,
    status: 'pending',
    auditTrail: [{
      actor: userId,
      action: 'Leave Requested',
      notes: `Applied for ${data.type || 'leave'} from ${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`,
    }],
  });

  // Notify school admins about new leave request
  const schoolAdmins = await User.find({ schoolId, role: 'school_admin' }).select('_id');
  if (schoolAdmins.length > 0) {
    const adminIds = schoolAdmins.map((a) => a._id);
    await sendBulkNotification(
      schoolId,
      adminIds,
      'New Leave Application',
      `${user.name} has submitted a ${leave.type} leave request (${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}).`,
      'leave_update'
    );
  }

  return leave;
};

/**
 * Approve leave and assign selected substitute teachers in an atomic transaction
 */
export const approveLeaveWithAssignments = async (leaveId, schoolId, assignments = [], userId) => {
  const user = await User.findById(userId);
  if (!user) throw new ApiError(401, 'Authentication required');

  const leave = await Leave.findOne({ _id: leaveId, schoolId });
  if (!leave) {
    throw new ApiError(404, 'Leave request not found');
  }

  if (leave.status !== 'pending') {
    throw new ApiError(409, `Leave request is no longer pending (current status: ${leave.status}).`);
  }

  if (userId.toString() === leave.requester.toString()) {
    throw new ApiError(403, 'You cannot approve your own leave request.');
  }

  // --- STUDENT LEAVE APPROVAL WORKFLOW ---
  if (leave.student || leave.requesterModel === 'Student') {
    if (user.role === 'teacher') {
      const teacher = await findTeacherForUser(schoolId, user);
      if (!teacher) {
        throw new ApiError(403, 'Teacher profile not found for user');
      }

      const isDirectApprover = leave.approverTeacher && leave.approverTeacher.toString() === teacher._id.toString();
      let isClassTeacher = isDirectApprover;

      if (!isClassTeacher) {
        const student = await Student.findOne({ _id: leave.student, schoolId });
        const currentClassTeacher = student ? await determineClassTeacher(schoolId, student) : null;
        if (currentClassTeacher && currentClassTeacher._id.toString() === teacher._id.toString()) {
          isClassTeacher = true;
        }
      }

      if (!isClassTeacher) {
        throw new ApiError(403, 'You are not authorized to approve leave for this student. Only the assigned class teacher can review this request.');
      }
    } else if (user.role !== 'school_admin' && user.role !== 'super_admin') {
      throw new ApiError(403, 'Unauthorized to approve leave requests');
    }

    const approvedAt = new Date();
    // Atomic update
    const updatedLeave = await Leave.findOneAndUpdate(
      { _id: leaveId, schoolId, status: 'pending' },
      {
        $set: {
          status: 'approved',
          approvedBy: userId,
          approvedAt,
        },
        $push: {
          auditTrail: {
            actor: userId,
            action: 'STUDENT_LEAVE_APPROVED',
            notes: `Approved by ${user.name} (${user.role})`,
          },
        },
      },
      { new: true }
    ).populate('student', 'firstName lastName currentClass currentSection');

    if (!updatedLeave) {
      throw new ApiError(409, 'Leave request is no longer pending or has already been processed.');
    }

    // Attendance integration
    if (updatedLeave.student) {
      await applyApprovedLeaveToAttendance(
        schoolId,
        updatedLeave.student._id,
        updatedLeave.student.currentClass,
        updatedLeave.student.currentSection,
        updatedLeave.startDate,
        updatedLeave.endDate,
        userId
      );
    }

    // Real-time notification to Parent
    const studentName = updatedLeave.student
      ? `${updatedLeave.student.firstName} ${updatedLeave.student.lastName}`
      : 'your child';
    await createNotification(schoolId, {
      recipient: updatedLeave.requester,
      type: 'leave_update',
      title: 'Student Leave Approved',
      message: `Leave request for ${studentName} (${new Date(updatedLeave.startDate).toLocaleDateString()} - ${new Date(updatedLeave.endDate).toLocaleDateString()}) has been approved.`,
      data: { leaveId: updatedLeave._id, studentId: updatedLeave.student?._id, status: 'approved' },
    });

    // Create Audit Log
    await createAuditLog({
      schoolId,
      actor: userId,
      action: 'STUDENT_LEAVE_APPROVED',
      entity: 'Leave',
      entityId: updatedLeave._id,
      before: { status: 'pending' },
      after: { status: 'approved', approvedBy: userId, approvedAt },
    });

    return { leave: updatedLeave };
  }

  // --- TEACHER LEAVE APPROVAL WORKFLOW ---
  if (user.role !== 'school_admin' && user.role !== 'super_admin') {
    throw new ApiError(403, 'Only school administrators can approve teacher leave requests.');
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const leaveDoc = await Leave.findOne({ _id: leaveId, schoolId, status: 'pending' }).session(session);
    if (!leaveDoc) {
      throw new ApiError(404, 'Leave request not found or is no longer pending.');
    }

    // 1. Recalculate affected lectures
    const { affectedLectures, teacher } = await getAffectedLectures(leaveId, schoolId);

    // If there are affected lectures, every lecture must have a valid substitute assignment provided
    if (affectedLectures.length > 0) {
      if (!assignments || assignments.length < affectedLectures.length) {
        throw new ApiError(400, `All ${affectedLectures.length} affected lectures must have a substitute teacher assigned before approval.`);
      }

      // Verify each affected lecture has a matching substitute assignment in payload
      for (const reqSlot of affectedLectures) {
        const assignedItem = assignments.find(
          (a) => a.periodNo === reqSlot.periodNo &&
            new Date(a.date).toISOString().split('T')[0] === new Date(reqSlot.date).toISOString().split('T')[0] &&
            (a.timetableId?.toString() === reqSlot.timetableId?.toString() || a.lectureKey === reqSlot.lectureKey)
        );

        if (!assignedItem || !assignedItem.substituteTeacherId) {
          throw new ApiError(400, `Missing substitute teacher assignment for period ${reqSlot.periodNo} on ${new Date(reqSlot.date).toLocaleDateString()}.`);
        }
      }
    }

    // 2. Re-validate each substitute teacher's availability inside transaction
    const createdSubstitutions = [];
    const notificationList = [];

    for (const item of assignments) {
      const {
        timetableId,
        date,
        day,
        periodNo,
        startTime,
        endTime,
        subjectId,
        classId,
        sectionId,
        room,
        originalTeacherId,
        substituteTeacherId,
      } = item;

      const subTeacher = await Teacher.findOne({ _id: substituteTeacherId, schoolId, status: 'active' }).session(session);
      if (!subTeacher) {
        throw new ApiError(400, `Selected substitute teacher not found or inactive.`);
      }

      const dateNorm = new Date(date);
      dateNorm.setHours(0, 0, 0, 0);

      // Check if substitute teacher has a conflicting substitution for this time
      const subConflict = await Substitution.findOne({
        schoolId,
        substituteTeacher: substituteTeacherId,
        date: dateNorm,
        status: 'assigned',
      }).session(session);

      if (subConflict) {
        if (timesOverlap(startTime, endTime, subConflict.startTime, subConflict.endTime)) {
          throw new ApiError(409, `Teacher ${subTeacher.firstName} ${subTeacher.lastName} has just been assigned to another lecture during ${startTime} – ${endTime}. Please refresh availability and select another replacement.`);
        }
      }

      // Check regular timetable conflict for substitute teacher
      const ttConflict = await Timetable.findOne({
        schoolId,
        status: 'published',
        periods: {
          $elemMatch: {
            teacher: substituteTeacherId,
            day,
            $or: [{ periodNo }, { startTime: { $exists: true } }],
          },
        },
      }).session(session);

      if (ttConflict) {
        const pMatch = ttConflict.periods.find(
          (p) => p.teacher?.toString() === substituteTeacherId.toString() &&
            p.day === day &&
            (p.periodNo === periodNo || (p.startTime && p.endTime && timesOverlap(startTime, endTime, p.startTime, p.endTime)))
        );
        if (pMatch) {
          throw new ApiError(409, `Teacher ${subTeacher.firstName} ${subTeacher.lastName} has a regular class during ${startTime} – ${endTime}. Please select another replacement.`);
        }
      }

      // Check approved leave for substitute teacher
      const subTeacherUser = await User.findOne({
        schoolId,
        $or: [
          { email: subTeacher.contact?.email },
          { email: subTeacher.email },
          { profileId: subTeacher._id },
        ],
      }).session(session);

      if (subTeacherUser) {
        const subLeave = await Leave.findOne({
          schoolId,
          requester: subTeacherUser._id,
          status: 'approved',
          startDate: { $lte: dateNorm },
          endDate: { $gte: dateNorm },
        }).session(session);

        if (subLeave) {
          if (!subLeave.isPartialDay || (subLeave.startTime && subLeave.endTime && timesOverlap(startTime, endTime, subLeave.startTime, subLeave.endTime))) {
            throw new ApiError(409, `Teacher ${subTeacher.firstName} ${subTeacher.lastName} is on approved leave for this date/time.`);
          }
        }
      }

      // Create Substitution Record
      const newSub = await Substitution.create([{
        schoolId,
        leaveId: leaveDoc._id,
        timetableId,
        date: dateNorm,
        day,
        periodNo,
        startTime,
        endTime,
        subject: subjectId,
        schoolClass: classId,
        section: sectionId,
        room,
        originalTeacher: originalTeacherId || teacher?._id,
        substituteTeacher: substituteTeacherId,
        status: 'assigned',
        assignedBy: userId,
        assignedAt: new Date(),
      }], { session });

      createdSubstitutions.push(newSub[0]);

      if (subTeacherUser) {
        notificationList.push({
          recipient: subTeacherUser._id,
          subTeacherName: `${subTeacher.firstName} ${subTeacher.lastName}`,
          date: dateNorm,
          startTime,
          endTime,
          subId: newSub[0]._id,
        });
      }
    }

    // 3. Mark Leave as Approved
    leaveDoc.status = 'approved';
    leaveDoc.approvedBy = userId;
    leaveDoc.approvedAt = new Date();
    leaveDoc.substitutionsCount = affectedLectures.length;
    leaveDoc.substitutionsAssignedCount = createdSubstitutions.length;

    leaveDoc.auditTrail.push({
      actor: userId,
      action: 'Leave APPROVED',
      notes: `Approved with ${createdSubstitutions.length} substitute assignment(s).`,
    });

    await leaveDoc.save({ session });

    await session.commitTransaction();
    session.endSession();

    // 4. Send Real-time Notifications outside session
    for (const item of notificationList) {
      const formattedDate = new Date(item.date).toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      });
      await createNotification(schoolId, {
        recipient: item.recipient,
        type: 'leave_update',
        title: 'Substitution Assigned',
        message: `You have been assigned as a substitute teacher on ${formattedDate} at ${item.startTime} – ${item.endTime}.`,
        data: { substitutionId: item.subId, leaveId: leaveDoc._id },
      });
    }

    // Notify requester teacher
    await createNotification(schoolId, {
      recipient: leaveDoc.requester,
      type: 'leave_update',
      title: 'Leave Request Approved',
      message: `Your leave request for ${new Date(leaveDoc.startDate).toLocaleDateString()} to ${new Date(leaveDoc.endDate).toLocaleDateString()} has been approved (${createdSubstitutions.length} substitutions arranged).`,
      data: { leaveId: leaveDoc._id, status: 'approved' },
    });

    await createAuditLog({
      schoolId,
      actor: userId,
      action: 'TEACHER_LEAVE_APPROVED',
      entity: 'Leave',
      entityId: leaveDoc._id,
      before: { status: 'pending' },
      after: { status: 'approved', approvedBy: userId, approvedAt: leaveDoc.approvedAt },
    });

    return {
      leave: leaveDoc,
      substitutions: createdSubstitutions,
    };
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    throw err;
  }
};

/**
 * Reject leave application
 */
export const rejectLeave = async (leaveId, schoolId, rejectionReason, userId) => {
  if (!rejectionReason || !rejectionReason.trim()) {
    throw new ApiError(400, 'Rejection reason is required.');
  }

  const leave = await Leave.findOne({ _id: leaveId, schoolId });
  if (!leave) throw new ApiError(404, 'Leave request not found');
  if (leave.status !== 'pending') {
    throw new ApiError(409, `Leave request is no longer pending (current status: ${leave.status}).`);
  }

  const user = await User.findById(userId);
  if (!user) throw new ApiError(401, 'User not found');

  if (userId.toString() === leave.requester.toString()) {
    throw new ApiError(403, 'You cannot reject your own leave request.');
  }

  // --- STUDENT LEAVE REJECTION WORKFLOW ---
  if (leave.student || leave.requesterModel === 'Student') {
    if (user.role === 'teacher') {
      const teacher = await findTeacherForUser(schoolId, user);
      if (!teacher) {
        throw new ApiError(403, 'Teacher profile not found for user');
      }

      const isDirectApprover = leave.approverTeacher && leave.approverTeacher.toString() === teacher._id.toString();
      let isClassTeacher = isDirectApprover;

      if (!isClassTeacher) {
        const student = await Student.findOne({ _id: leave.student, schoolId });
        const currentClassTeacher = student ? await determineClassTeacher(schoolId, student) : null;
        if (currentClassTeacher && currentClassTeacher._id.toString() === teacher._id.toString()) {
          isClassTeacher = true;
        }
      }

      if (!isClassTeacher) {
        throw new ApiError(403, 'You are not authorized to reject leave for this student. Only the assigned class teacher can review this request.');
      }
    } else if (user.role !== 'school_admin' && user.role !== 'super_admin') {
      throw new ApiError(403, 'Unauthorized to reject leave requests');
    }

    const rejectedAt = new Date();
    const updatedLeave = await Leave.findOneAndUpdate(
      { _id: leaveId, schoolId, status: 'pending' },
      {
        $set: {
          status: 'rejected',
          rejectedBy: userId,
          rejectedAt,
          rejectionReason: rejectionReason.trim(),
        },
        $push: {
          auditTrail: {
            actor: userId,
            action: 'STUDENT_LEAVE_REJECTED',
            notes: `Rejected by ${user.name} (${user.role}). Reason: ${rejectionReason.trim()}`,
          },
        },
      },
      { new: true }
    ).populate('student', 'firstName lastName');

    if (!updatedLeave) {
      throw new ApiError(409, 'Leave request is no longer pending or has already been processed.');
    }

    // Notify Parent
    const studentName = updatedLeave.student
      ? `${updatedLeave.student.firstName} ${updatedLeave.student.lastName}`
      : 'your child';
    await createNotification(schoolId, {
      recipient: updatedLeave.requester,
      type: 'leave_update',
      title: 'Student Leave Rejected',
      message: `Leave request for ${studentName} was rejected. Reason: ${rejectionReason.trim()}`,
      data: { leaveId: updatedLeave._id, studentId: updatedLeave.student?._id, status: 'rejected', rejectionReason: rejectionReason.trim() },
    });

    // Create Audit Log
    await createAuditLog({
      schoolId,
      actor: userId,
      action: 'STUDENT_LEAVE_REJECTED',
      entity: 'Leave',
      entityId: updatedLeave._id,
      before: { status: 'pending' },
      after: { status: 'rejected', rejectedBy: userId, rejectedAt, rejectionReason: rejectionReason.trim() },
    });

    return updatedLeave;
  }

  // --- TEACHER LEAVE REJECTION WORKFLOW ---
  if (user.role !== 'school_admin' && user.role !== 'super_admin') {
    throw new ApiError(403, 'Only school administrators can reject teacher leave requests.');
  }

  leave.status = 'rejected';
  leave.approvedBy = userId;
  leave.rejectedBy = userId;
  leave.rejectedAt = new Date();
  leave.rejectionReason = rejectionReason.trim();

  leave.auditTrail.push({
    actor: userId,
    action: 'Leave REJECTED',
    notes: `Reason: ${rejectionReason.trim()}`,
  });

  await leave.save();

  // Notify requester teacher
  await createNotification(schoolId, {
    recipient: leave.requester,
    type: 'leave_update',
    title: 'Leave Request Rejected',
    message: `Your leave request for ${new Date(leave.startDate).toLocaleDateString()} to ${new Date(leave.endDate).toLocaleDateString()} was rejected. Reason: ${rejectionReason.trim()}`,
    data: { leaveId: leave._id, status: 'rejected', rejectionReason: rejectionReason.trim() },
  });

  await createAuditLog({
    schoolId,
    actor: userId,
    action: 'TEACHER_LEAVE_REJECTED',
    entity: 'Leave',
    entityId: leave._id,
    before: { status: 'pending' },
    after: { status: 'rejected', rejectedBy: userId, rejectionReason: rejectionReason.trim() },
  });

  return leave;
};

/**
 * Get paginated leaves
 */
export const getLeaves = async (schoolId, options = {}, user) => {
  const query = { schoolId };

  if (user?.role === 'parent') {
    const parent = await getParentForUser(user, schoolId);
    if (options.studentId) {
      const isLinked = parent.students?.some((s) => s.toString() === options.studentId.toString());
      if (!isLinked) {
        throw new ApiError(403, 'You are not authorized to view leaves for this student');
      }
      query.student = options.studentId;
    } else {
      query.$or = [
        { requester: user._id },
        { student: { $in: parent.students || [] } },
      ];
    }
  } else if (user?.role === 'teacher') {
    const teacher = await findTeacherForUser(schoolId, user);
    if (options.view === 'class' || options.scope === 'class' || options.role === 'student') {
      // Return student leaves for which this teacher is the assigned approver
      query.approverTeacher = teacher?._id;
      query.$or = [{ requesterModel: { $in: ['Student', 'Parent'] } }, { student: { $exists: true, $ne: null } }];
    } else if (options.view === 'all') {
      query.$or = [
        { requester: user._id },
        ...(teacher ? [{ approverTeacher: teacher._id }] : []),
      ];
    } else {
      // Default for teacher is their own leaves
      query.requester = user._id;
    }
  } else if (user?.role === 'student') {
    query.requester = user._id;
  } else {
    // school_admin or super_admin
    if (options.requesterModel && options.requesterModel !== 'all') {
      query.requesterModel = options.requesterModel;
    }
    if (options.studentId) {
      query.student = options.studentId;
    }
    if (options.role === 'student' || options.target === 'student') {
      query.$or = [{ requesterModel: 'Student' }, { student: { $exists: true, $ne: null } }];
    } else if (options.role === 'teacher' || options.target === 'teacher') {
      query.student = null;
      query.$or = [{ requesterModel: 'Teacher' }, { student: null }];
    }
  }

  if (options.status && options.status !== 'all') {
    query.status = options.status;
  }
  if (options.type && options.type !== 'all') {
    query.type = options.type;
  }

  return paginate(Leave, query, {
    ...options,
    sort: options.sort || '-createdAt',
    populate: [
      { path: 'requester', select: 'name email role' },
      { path: 'approvedBy', select: 'name role' },
      { path: 'rejectedBy', select: 'name role' },
      { path: 'substituteTeacher', select: 'firstName lastName' },
      {
        path: 'student',
        select: 'firstName lastName admissionNo rollNo currentClass currentSection avatar',
        populate: [
          { path: 'currentClass', select: 'name' },
          { path: 'currentSection', select: 'name' },
        ],
      },
      { path: 'parent', select: 'firstName lastName contact' },
      { path: 'approverTeacher', select: 'firstName lastName employeeId department' },
    ],
  });
};

/**
 * Get leave details with assigned substitutions
 */
export const getLeaveById = async (id, schoolId) => {
  const leave = await Leave.findOne({ _id: id, schoolId })
    .populate('requester', 'name email role')
    .populate('approvedBy', 'name role')
    .populate('rejectedBy', 'name role')
    .populate({
      path: 'student',
      select: 'firstName lastName admissionNo rollNo currentClass currentSection avatar',
      populate: [
        { path: 'currentClass', select: 'name' },
        { path: 'currentSection', select: 'name' },
      ],
    })
    .populate('parent', 'firstName lastName contact')
    .populate('approverTeacher', 'firstName lastName employeeId department')
    .populate('auditTrail.actor', 'name role');

  if (!leave) throw new ApiError(404, 'Leave request not found');

  const substitutions = await Substitution.find({ schoolId, leaveId: id })
    .populate('originalTeacher', 'firstName lastName')
    .populate('substituteTeacher', 'firstName lastName department')
    .populate('subject', 'name code')
    .populate('schoolClass', 'name')
    .populate('section', 'name');

  return {
    leave,
    substitutions,
  };
};

/**
 * Cancel leave
 */
export const cancelLeave = async (id, schoolId, userId, notes) => {
  const leave = await Leave.findOne({ _id: id, schoolId });
  if (!leave) throw new ApiError(404, 'Leave request not found');

  const user = await User.findById(userId);
  let isOwner = leave.requester.toString() === userId.toString();

  if (!isOwner && user?.role === 'parent' && leave.student) {
    const parent = await getParentForUser(user, schoolId);
    if (parent.students?.some((s) => s.toString() === leave.student.toString())) {
      isOwner = true;
    }
  }

  const isAdmin = user && (user.role === 'school_admin' || user.role === 'super_admin');

  if (!isOwner && !isAdmin) {
    throw new ApiError(403, 'Unauthorized to cancel this leave request');
  }

  if (leave.status === 'cancelled') {
    throw new ApiError(400, 'Leave request is already cancelled');
  }

  if (leave.status !== 'pending') {
    throw new ApiError(400, `Cannot cancel a leave request in '${leave.status}' status`);
  }

  leave.status = 'cancelled';
  leave.auditTrail.push({
    actor: userId,
    action: leave.student ? 'STUDENT_LEAVE_CANCELLED' : 'Leave CANCELLED',
    notes: notes || 'Cancelled by user',
  });

  await leave.save();

  if (leave.student) {
    await createAuditLog({
      schoolId,
      actor: userId,
      action: 'STUDENT_LEAVE_CANCELLED',
      entity: 'Leave',
      entityId: leave._id,
      before: { status: 'pending' },
      after: { status: 'cancelled' },
    });
  }

  if (leave.requesterModel === 'Teacher') {
    const substitutions = await Substitution.find({ schoolId, leaveId: id });
    for (const sub of substitutions) {
      await cancelSubstitution({
        schoolId,
        substitutionId: sub._id,
        userId,
        reason: 'Associated leave request was cancelled',
      });
    }
  }

  return leave;
};

/**
 * Get current user's leaves
 */
export const getMyLeaves = async (userId, options = {}) => {
  const user = await User.findById(userId);
  const query = {};

  if (user?.role === 'parent') {
    const parent = await getParentForUser(user, user.schoolId);
    query.$or = [{ requester: userId }, { student: { $in: parent.students || [] } }];
  } else {
    query.requester = userId;
  }

  if (options.status && options.status !== 'all') query.status = options.status;

  return paginate(Leave, query, {
    ...options,
    sort: '-createdAt',
    populate: [
      { path: 'requester', select: 'name email role' },
      { path: 'approvedBy', select: 'name role' },
      { path: 'rejectedBy', select: 'name role' },
      { path: 'substituteTeacher', select: 'firstName lastName' },
      {
        path: 'student',
        select: 'firstName lastName admissionNo rollNo currentClass currentSection avatar',
        populate: [
          { path: 'currentClass', select: 'name' },
          { path: 'currentSection', select: 'name' },
        ],
      },
      { path: 'approverTeacher', select: 'firstName lastName employeeId department' },
    ],
  });
};
