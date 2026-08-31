import mongoose from 'mongoose';
import Leave from '../models/Leave.js';
import User from '../models/User.js';
import Substitution from '../models/Substitution.js';
import Timetable from '../models/Timetable.js';
import TimetableConfig from '../models/TimetableConfig.js';
import Teacher from '../models/Teacher.js';
import ApiError from '../utils/ApiError.js';
import { paginate } from '../utils/pagination.js';
import { createNotification, sendBulkNotification } from './notification.service.js';
import {
  timesOverlap,
  timeToMinutes,
  resolvePeriodTimes,
  getEligibleTeachersForLectureSlot,
  cancelSubstitution,
} from './substitution.service.js';

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

  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, 'User not found');

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
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const leave = await Leave.findOne({ _id: leaveId, schoolId, status: 'pending' }).session(session);
    if (!leave) {
      throw new ApiError(404, 'Leave request not found or is no longer pending.');
    }

    if (userId.toString() === leave.requester.toString()) {
      throw new ApiError(403, 'You cannot approve your own leave request.');
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
        leaveId: leave._id,
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
    leave.status = 'approved';
    leave.approvedBy = userId;
    leave.substitutionsCount = affectedLectures.length;
    leave.substitutionsAssignedCount = createdSubstitutions.length;

    leave.auditTrail.push({
      actor: userId,
      action: 'Leave APPROVED',
      notes: `Approved with ${createdSubstitutions.length} substitute assignment(s).`,
    });

    await leave.save({ session });

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
        data: { substitutionId: item.subId, leaveId: leave._id },
      });
    }

    // Notify requester teacher
    await createNotification(schoolId, {
      recipient: leave.requester,
      type: 'leave_update',
      title: 'Leave Request Approved',
      message: `Your leave request for ${new Date(leave.startDate).toLocaleDateString()} to ${new Date(leave.endDate).toLocaleDateString()} has been approved (${createdSubstitutions.length} substitutions arranged).`,
      data: { leaveId: leave._id, status: 'approved' },
    });

    return {
      leave,
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

  const leave = await Leave.findOne({ _id: leaveId, schoolId, status: 'pending' });
  if (!leave) throw new ApiError(404, 'Leave request not found or is no longer pending.');

  if (userId.toString() === leave.requester.toString()) {
    throw new ApiError(403, 'You cannot reject your own leave request.');
  }

  leave.status = 'rejected';
  leave.approvedBy = userId;
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

  return leave;
};

/**
 * Get paginated leaves
 */
export const getLeaves = async (schoolId, options, user) => {
  const query = { schoolId };
  if (user && (user.role === 'parent' || user.role === 'student')) {
    query.requester = user._id;
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
      { path: 'approvedBy', select: 'name' },
      { path: 'substituteTeacher', select: 'firstName lastName' },
    ],
  });
};

/**
 * Get leave details with assigned substitutions
 */
export const getLeaveById = async (id, schoolId) => {
  const leave = await Leave.findOne({ _id: id, schoolId })
    .populate('requester', 'name email role')
    .populate('approvedBy', 'name')
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
  const isOwner = leave.requester.toString() === userId.toString();
  const isAdmin = user && user.role === 'school_admin';

  if (!isOwner && !isAdmin) {
    throw new ApiError(403, 'Unauthorized to cancel this leave request');
  }

  if (leave.status === 'cancelled') {
    throw new ApiError(400, 'Leave request is already cancelled');
  }

  leave.status = 'cancelled';
  leave.auditTrail.push({
    actor: userId,
    action: 'Leave CANCELLED',
    notes: notes || 'Cancelled by user',
  });

  await leave.save();

  const substitutions = await Substitution.find({ schoolId, leaveId: id });
  for (const sub of substitutions) {
    await cancelSubstitution({
      schoolId,
      substitutionId: sub._id,
      userId,
      reason: 'Associated leave request was cancelled',
    });
  }

  return leave;
};

/**
 * Get current user's leaves
 */
export const getMyLeaves = async (userId, options) => {
  const query = { requester: userId };
  if (options.status && options.status !== 'all') query.status = options.status;

  return paginate(Leave, query, {
    ...options,
    sort: '-createdAt',
    populate: [
      { path: 'approvedBy', select: 'name' },
      { path: 'substituteTeacher', select: 'firstName lastName' },
    ],
  });
};
