import mongoose from 'mongoose';
import Substitution from '../models/Substitution.js';
import Leave from '../models/Leave.js';
import Timetable from '../models/Timetable.js';
import TimetableConfig from '../models/TimetableConfig.js';
import Teacher from '../models/Teacher.js';
import User from '../models/User.js';
import ApiError from '../utils/ApiError.js';
import { paginate } from '../utils/pagination.js';
import { createNotification } from './notification.service.js';

// Helper: parse "HH:MM" or "HH:MM AM/PM" into minutes from midnight
export const timeToMinutes = (timeStr) => {
  if (!timeStr) return 0;
  let str = timeStr.trim();
  const isPM = /pm/i.test(str);
  const isAM = /am/i.test(str);
  str = str.replace(/(am|pm)/i, '').trim();

  let [h, m] = str.split(':').map(Number);
  h = h || 0;
  m = m || 0;

  if (isPM && h < 12) h += 12;
  if (isAM && h === 12) h = 0;

  return h * 60 + m;
};

// Exact interval overlap check: existingStart < requestedEnd AND existingEnd > requestedStart
export const timesOverlap = (s1, e1, s2, e2) => {
  const start1 = timeToMinutes(s1);
  const end1 = timeToMinutes(e1);
  const start2 = timeToMinutes(s2);
  const end2 = timeToMinutes(e2);
  return Math.max(start1, start2) < Math.min(end1, end2);
};

/**
 * Resolve standard start & end time for a period number if not set on the period object
 */
export const resolvePeriodTimes = (period, config) => {
  if (period?.startTime && period?.endTime) {
    return { startTime: period.startTime, endTime: period.endTime };
  }

  // Look up in TimetableConfig if available
  if (config?.periodTimings?.length > 0) {
    const timing = config.periodTimings.find((pt) => pt.periodNo === period?.periodNo);
    if (timing?.startTime && timing?.endTime) {
      return { startTime: timing.startTime, endTime: timing.endTime };
    }
  }

  // Standard fallback default times: Period 1 = 09:00 - 10:00, Period 2 = 10:00 - 11:00, etc.
  const pNo = period?.periodNo || 1;
  const startHour = 8 + pNo;
  const endHour = startHour + 1;
  const startTime = `${startHour.toString().padStart(2, '0')}:00`;
  const endTime = `${endHour.toString().padStart(2, '0')}:00`;

  return { startTime, endTime };
};

/**
 * Calculate free and busy teachers for a specific lecture slot
 * Input params: { schoolId, date, day, startTime, endTime, periodNo, originalTeacherId, subjectId, classId }
 */
export const getEligibleTeachersForLectureSlot = async (schoolId, options) => {
  const {
    date,
    day,
    startTime,
    endTime,
    periodNo,
    originalTeacherId,
    subjectId,
    classId,
  } = options;

  if (!date || day === undefined || !startTime || !endTime) {
    throw new ApiError(400, 'Missing required slot parameters (date, day, startTime, endTime)');
  }

  const dateNormalized = new Date(date);
  dateNormalized.setHours(0, 0, 0, 0);

  // Start of week & End of week for weekly workload calculation
  const startOfWeek = new Date(dateNormalized);
  startOfWeek.setDate(dateNormalized.getDate() - dateNormalized.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);

  // Fetch all active teachers in school
  const candidateTeachers = await Teacher.find({
    schoolId,
    status: 'active',
  }).populate('subjects', 'name').populate('assignedClasses', 'name');

  const freeTeachers = [];
  const busyTeachers = [];

  for (const t of candidateTeachers) {
    // Exclusion 1: Never include the original teacher requesting leave
    if (originalTeacherId && t._id.toString() === originalTeacherId.toString()) {
      busyTeachers.push({
        teacher: {
          _id: t._id,
          firstName: t.firstName,
          lastName: t.lastName,
          employeeId: t.employeeId,
          department: t.department,
        },
        busyReason: 'Original Teacher on Leave',
      });
      continue;
    }

    let isBusy = false;
    let busyReason = '';

    // Exclusion 2: Check if candidate teacher is on approved leave for this date/time
    const teacherUser = await User.findOne({
      schoolId,
      $or: [
        { email: t.contact?.email },
        { email: t.email },
        { profileId: t._id },
      ],
    });

    if (teacherUser) {
      const leaveConflict = await Leave.findOne({
        schoolId,
        requester: teacherUser._id,
        status: 'approved',
        startDate: { $lte: dateNormalized },
        endDate: { $gte: dateNormalized },
      });

      if (leaveConflict) {
        if (!leaveConflict.isPartialDay) {
          isBusy = true;
          busyReason = `On Approved Leave (${leaveConflict.type || 'Full Day'})`;
        } else if (leaveConflict.startTime && leaveConflict.endTime) {
          if (timesOverlap(startTime, endTime, leaveConflict.startTime, leaveConflict.endTime)) {
            isBusy = true;
            busyReason = `On Partial-Day Leave (${leaveConflict.startTime} – ${leaveConflict.endTime})`;
          }
        }
      }
    }

    // Exclusion 3: Check if candidate teacher has a regular timetable lecture at this day & overlapping time
    if (!isBusy) {
      const timetables = await Timetable.find({
        schoolId,
        status: 'published',
        'periods.teacher': t._id,
        'periods.day': day,
      }).populate('schoolClass', 'name').populate('section', 'name').populate('periods.subject', 'name');

      for (const tt of timetables) {
        for (const p of tt.periods || []) {
          if (!p.teacher || p.teacher.toString() !== t._id.toString()) continue;
          if (p.day !== day) continue;
          if (p.isLunch || p.isBreak || p.isAssembly) continue;

          // If period times are available, check time overlap; else check periodNo
          if (p.startTime && p.endTime) {
            if (timesOverlap(startTime, endTime, p.startTime, p.endTime)) {
              isBusy = true;
              busyReason = `Regular Class: ${p.subject?.name || 'Subject'} (${tt.schoolClass?.name || ''}${tt.section?.name ? ' - ' + tt.section.name : ''}) at ${p.startTime} – ${p.endTime}`;
              break;
            }
          } else if (periodNo && p.periodNo === periodNo) {
            isBusy = true;
            busyReason = `Regular Class: Period ${p.periodNo} (${tt.schoolClass?.name || ''}${tt.section?.name ? ' - ' + tt.section.name : ''})`;
            break;
          }
        }
        if (isBusy) break;
      }
    }

    // Exclusion 4: Check existing assigned substitutions for this date & slot
    if (!isBusy) {
      const subConflicts = await Substitution.find({
        schoolId,
        substituteTeacher: t._id,
        date: dateNormalized,
        status: 'assigned',
      }).populate('schoolClass', 'name').populate('subject', 'name');

      for (const sc of subConflicts) {
        if (sc.startTime && sc.endTime) {
          if (timesOverlap(startTime, endTime, sc.startTime, sc.endTime)) {
            isBusy = true;
            busyReason = `Assigned Substitution: ${sc.subject?.name || 'Class'} (${sc.schoolClass?.name || ''}) at ${sc.startTime} – ${sc.endTime}`;
            break;
          }
        } else if (periodNo && sc.periodNo === periodNo) {
          isBusy = true;
          busyReason = `Assigned Substitution: Period ${sc.periodNo}`;
          break;
        }
      }
    }

    // Exclusion 5: Check teacher unavailable periods
    if (!isBusy && t.unavailablePeriods?.length > 0) {
      const isMarkedUnavailable = t.unavailablePeriods.some(
        (up) => up.day === day && up.periodNo === periodNo
      );
      if (isMarkedUnavailable) {
        isBusy = true;
        busyReason = `Marked Unavailable for Period ${periodNo}`;
      }
    }

    // Workload stats
    const substitutionsToday = await Substitution.countDocuments({
      schoolId,
      substituteTeacher: t._id,
      date: dateNormalized,
      status: 'assigned',
    });

    const substitutionsThisWeek = await Substitution.countDocuments({
      schoolId,
      substituteTeacher: t._id,
      date: { $gte: startOfWeek, $lte: endOfWeek },
      status: 'assigned',
    });

    const isSubjectMatch = subjectId
      ? t.subjects?.some((s) => s._id.toString() === subjectId.toString())
      : false;

    const isClassMatch = classId
      ? t.assignedClasses?.some((c) => c._id.toString() === classId.toString())
      : false;

    const teacherInfo = {
      _id: t._id,
      firstName: t.firstName,
      lastName: t.lastName,
      employeeId: t.employeeId,
      department: t.department,
      gender: t.gender,
      subjects: t.subjects,
      assignedClasses: t.assignedClasses,
      substitutionsToday,
      substitutionsThisWeek,
      isSubjectMatch,
      isClassMatch,
    };

    if (isBusy) {
      busyTeachers.push({
        teacher: teacherInfo,
        busyReason,
      });
    } else {
      // Calculate Suitability Score
      let score = 50;
      if (isSubjectMatch) score += 30;
      if (isClassMatch) score += 20;
      score -= substitutionsToday * 15;
      score -= substitutionsThisWeek * 5;

      let badgeText = 'Available Teacher';
      if (isSubjectMatch && isClassMatch) badgeText = 'Recommended · Subject & Grade Match';
      else if (isSubjectMatch) badgeText = 'Subject Expert';
      else if (isClassMatch) badgeText = 'Grade Teacher';

      freeTeachers.push({
        teacher: teacherInfo,
        score,
        badgeText,
        substitutionsToday,
        substitutionsThisWeek,
        isSubjectMatch,
        isClassMatch,
      });
    }
  }

  // Sort free teachers descending by score
  freeTeachers.sort((a, b) => b.score - a.score);

  console.log(`[TeacherAvailability] Slot: Day ${day} Period ${periodNo || ''} (${startTime} - ${endTime})`);
  console.log(` -> Total candidate teachers: ${candidateTeachers.length}`);
  console.log(` -> Free: ${freeTeachers.length}, Busy: ${busyTeachers.length}`);

  return {
    freeTeachers,
    busyTeachers,
  };
};

/**
 * Get paginated list of substitutions for admin
 */
export const getSubstitutions = async (schoolId, options) => {
  const query = { schoolId };
  if (options.status && options.status !== 'all') query.status = options.status;
  if (options.leaveId) query.leaveId = options.leaveId;
  if (options.date) {
    const d = new Date(options.date);
    d.setHours(0, 0, 0, 0);
    query.date = d;
  }

  return paginate(Substitution, query, {
    ...options,
    sort: options.sort || '-date periodNo',
    populate: [
      { path: 'originalTeacher', select: 'firstName lastName department' },
      { path: 'substituteTeacher', select: 'firstName lastName department' },
      { path: 'subject', select: 'name code' },
      { path: 'schoolClass', select: 'name' },
      { path: 'section', select: 'name' },
      { path: 'assignedBy', select: 'name' },
    ],
  });
};

/**
 * Get assigned substitutions for the logged in teacher
 */
export const getMySubstitutions = async (schoolId, userId, options) => {
  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, 'User not found');

  const teacher = await Teacher.findOne({
    schoolId,
    $or: [
      { 'contact.email': user.email },
      { email: user.email },
      { _id: user.profileId },
    ],
  });

  if (!teacher) return { data: [], meta: { page: 1, totalPages: 1, total: 0 } };

  const query = { schoolId, substituteTeacher: teacher._id, status: 'assigned' };

  return paginate(Substitution, query, {
    ...options,
    sort: '-date periodNo',
    populate: [
      { path: 'originalTeacher', select: 'firstName lastName department' },
      { path: 'subject', select: 'name code' },
      { path: 'schoolClass', select: 'name' },
      { path: 'section', select: 'name' },
    ],
  });
};

/**
 * Cancel a substitution assignment
 */
export const cancelSubstitution = async ({ schoolId, substitutionId, userId, reason }) => {
  const substitution = await Substitution.findOne({ _id: substitutionId, schoolId });
  if (!substitution) throw new ApiError(404, 'Substitution record not found');

  const previousSubstituteId = substitution.substituteTeacher;
  substitution.substituteTeacher = undefined;
  substitution.status = 'cancelled';
  substitution.notes = reason ? `Cancelled: ${reason}` : 'Cancelled';
  await substitution.save();

  if (previousSubstituteId) {
    const prevTeacher = await Teacher.findById(previousSubstituteId);
    if (prevTeacher) {
      const substituteUser = await User.findOne({
        $or: [
          { email: prevTeacher.contact?.email },
          { email: prevTeacher.email },
          { profileId: prevTeacher._id },
        ],
      });

      if (substituteUser) {
        await createNotification(schoolId, {
          recipient: substituteUser._id,
          type: 'leave_update',
          title: 'Substitution Cancelled',
          message: `Your substitution assignment on ${new Date(substitution.date).toLocaleDateString()} for period ${substitution.periodNo} has been cancelled.`,
          data: { substitutionId: substitution._id },
        });
      }
    }
  }

  return substitution;
};
