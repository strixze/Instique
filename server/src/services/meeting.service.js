import ParentMeeting from '../models/ParentMeeting.js';
import Student from '../models/Student.js';
import SchoolClass from '../models/SchoolClass.js';
import CalendarEvent from '../models/CalendarEvent.js';
import User from '../models/User.js';
import ApiError from '../utils/ApiError.js';
import { paginate } from '../utils/pagination.js';
import { sendBulkNotification } from './notification.service.js';

// Helper: Calculate invited parents and initial attendance entries from selected classes/sections
async function resolveAudienceAndAttendance(schoolId, targetClasses = [], targetSections = []) {
  if (!targetClasses || targetClasses.length === 0) {
    return { invitedParents: [], initialAttendance: [] };
  }

  const studentQuery = { schoolId, currentClass: { $in: targetClasses }, status: 'active' };
  if (targetSections && targetSections.length > 0) {
    studentQuery.currentSection = { $in: targetSections };
  }

  const students = await Student.find(studentQuery).select('_id currentClass currentSection parents');
  const parentSet = new Set();
  const initialAttendance = [];

  for (const student of students) {
    if (student.parents && student.parents.length > 0) {
      for (const parentId of student.parents) {
        parentSet.add(parentId.toString());
        initialAttendance.push({
          parentId: parentId,
          studentId: student._id,
          status: 'pending',
        });
      }
    }
  }

  return {
    invitedParents: Array.from(parentSet),
    initialAttendance,
  };
}

// Helper: Auto-recommend class teachers for selected target classes
async function resolveRecommendedTeachers(schoolId, targetClasses = [], assignedTeachers = []) {
  if (assignedTeachers && assignedTeachers.length > 0) {
    return assignedTeachers;
  }
  if (!targetClasses || targetClasses.length === 0) {
    return [];
  }
  const classes = await SchoolClass.find({ _id: { $in: targetClasses }, schoolId }).select('classTeacher');
  const classTeachers = classes
    .map((c) => c.classTeacher)
    .filter((t) => t)
    .map((t) => t.toString());
  return Array.from(new Set(classTeachers));
}

// Helper: Sync meeting with CalendarEvent
async function syncCalendarEvent(meeting, userId) {
  if (meeting.status === 'cancelled') {
    if (meeting.calendarEvent) {
      await CalendarEvent.findByIdAndUpdate(meeting.calendarEvent, { status: 'cancelled' });
    }
    return;
  }

  const eventData = {
    schoolId: meeting.schoolId,
    title: meeting.title,
    description: meeting.description || `Parent Teacher Meeting (${meeting.type})`,
    type: 'ptm',
    startDate: meeting.date,
    startTime: meeting.startTime,
    endTime: meeting.endTime,
    location: meeting.location || 'School Campus',
    targetClasses: meeting.targetClasses,
    audience: ['parents', 'teachers'],
    audienceScope: 'specific_classes',
    status: meeting.status === 'published' ? 'published' : 'draft',
    createdBy: userId || meeting.createdBy,
  };

  if (meeting.calendarEvent) {
    await CalendarEvent.findByIdAndUpdate(meeting.calendarEvent, eventData);
  } else {
    const calEvent = await CalendarEvent.create(eventData);
    meeting.calendarEvent = calEvent._id;
    await meeting.save();
  }
}

// Helper: Send notification to invited parents when published
async function notifyInvitedParents(meeting) {
  if (!meeting.invitedParents || meeting.invitedParents.length === 0) return;

  const parentUsers = await User.find({
    schoolId: meeting.schoolId,
    role: 'parent',
    profileId: { $in: meeting.invitedParents },
  }).select('_id');

  if (parentUsers.length === 0) return;

  const recipientIds = parentUsers.map((u) => u._id);
  const formattedDate = new Date(meeting.date).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const title = `Parent Teacher Meeting: ${meeting.title}`;
  const message = `A Parent Teacher Meeting has been scheduled on ${formattedDate} (${meeting.startTime} – ${meeting.endTime}). Location: ${meeting.location || 'School Campus'}. Please review and confirm your availability.`;

  await sendBulkNotification(meeting.schoolId, recipientIds, title, message, 'meeting');
}

export const createMeeting = async (schoolId, data, userId) => {
  const { invitedParents, initialAttendance } = await resolveAudienceAndAttendance(
    schoolId,
    data.targetClasses,
    data.targetSections
  );

  const assignedTeachers = await resolveRecommendedTeachers(
    schoolId,
    data.targetClasses,
    data.assignedTeachers
  );

  const status = data.status || 'draft';

  const meeting = await ParentMeeting.create({
    ...data,
    schoolId,
    assignedTeachers,
    invitedParents,
    attendance: initialAttendance,
    status,
    publishedAt: status === 'published' ? new Date() : null,
    createdBy: userId,
  });

  if (status === 'published') {
    await syncCalendarEvent(meeting, userId);
    await notifyInvitedParents(meeting);
  }

  return meeting;
};

export const getMeetings = async (schoolId, options = {}, user = null) => {
  const { page = 1, limit = 10, search, status, type, dateRange, classId, teacherId } = options;
  const query = { schoolId };

  // Role-based restrictions
  if (user) {
    if (user.role === 'teacher' && user.profileId) {
      query.$or = [
        { assignedTeachers: user.profileId },
        { createdBy: user._id },
      ];
    } else if (user.role === 'parent' && user.profileId) {
      query.invitedParents = user.profileId;
      query.status = { $in: ['published', 'completed'] };
    }
  }

  // Filter by Status
  const now = new Date();
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  if (status && status !== 'all') {
    if (status === 'upcoming') {
      query.date = { $gte: startToday };
      query.status = { $in: ['published', 'draft'] };
    } else if (status === 'today') {
      query.date = { $gte: startToday, $lte: endToday };
      query.status = { $ne: 'cancelled' };
    } else if (status === 'completed') {
      query.$or = [
        { status: 'completed' },
        { date: { $lt: startToday }, status: 'published' },
      ];
    } else {
      query.status = status;
    }
  }

  // Filter by Type
  if (type && type !== 'all') {
    query.type = type;
  }

  // Filter by Class
  if (classId && classId !== 'all') {
    query.targetClasses = classId;
  }

  // Filter by Teacher
  if (teacherId && teacherId !== 'all') {
    query.assignedTeachers = teacherId;
  }

  // Filter by Date Range
  if (dateRange === 'today') {
    query.date = { $gte: startToday, $lte: endToday };
  } else if (dateRange === 'this_week') {
    const startWeek = new Date(now);
    startWeek.setDate(now.getDate() - now.getDay());
    startWeek.setHours(0, 0, 0, 0);
    const endWeek = new Date(startWeek);
    endWeek.setDate(startWeek.getDate() + 6);
    endWeek.setHours(23, 59, 59, 999);
    query.date = { $gte: startWeek, $lte: endWeek };
  } else if (dateRange === 'this_month') {
    const startMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    query.date = { $gte: startMonth, $lte: endMonth };
  }

  return paginate(ParentMeeting, query, {
    page,
    limit,
    search,
    searchFields: ['title', 'location', 'type', 'description', 'instructions'],
    populate: [
      { path: 'targetClasses', select: 'name' },
      { path: 'targetSections', select: 'name' },
      { path: 'assignedTeachers', select: 'firstName lastName employeeId' },
      { path: 'invitedParents', select: 'firstName lastName contact' },
      { path: 'createdBy', select: 'name email role' },
    ],
    sort: '-date',
  });
};

export const getMeetingStats = async (schoolId, user = null) => {
  const now = new Date();
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  const baseQuery = { schoolId };
  if (user?.role === 'teacher' && user.profileId) {
    baseQuery.$or = [{ assignedTeachers: user.profileId }, { createdBy: user._id }];
  } else if (user?.role === 'parent' && user.profileId) {
    baseQuery.invitedParents = user.profileId;
    baseQuery.status = { $in: ['published', 'completed'] };
  }

  const [upcomingCount, todayCount, completedCount, invitedParentsAgg] = await Promise.all([
    ParentMeeting.countDocuments({
      ...baseQuery,
      date: { $gte: startToday },
      status: { $in: ['published', 'draft'] },
    }),
    ParentMeeting.countDocuments({
      ...baseQuery,
      date: { $gte: startToday, $lte: endToday },
      status: { $ne: 'cancelled' },
    }),
    ParentMeeting.countDocuments({
      ...baseQuery,
      $or: [{ status: 'completed' }, { date: { $lt: startToday }, status: 'published' }],
    }),
    ParentMeeting.aggregate([
      { $match: baseQuery },
      { $unwind: '$invitedParents' },
      { $group: { _id: '$invitedParents' } },
      { $count: 'total' },
    ]),
  ]);

  const parentsInvitedCount = invitedParentsAgg[0]?.total || 0;

  return {
    upcomingCount,
    todayCount,
    completedCount,
    parentsInvitedCount,
  };
};

export const getMeetingById = async (id, schoolId, user = null) => {
  const meeting = await ParentMeeting.findOne({ _id: id, schoolId })
    .populate('targetClasses', 'name sections')
    .populate('targetSections', 'name')
    .populate('assignedTeachers', 'firstName lastName employeeId department contact')
    .populate('invitedParents', 'firstName lastName contact students')
    .populate('rsvps.parentId', 'firstName lastName contact')
    .populate('rsvps.studentId', 'firstName lastName admissionNo rollNo')
    .populate('attendance.parentId', 'firstName lastName contact')
    .populate('attendance.studentId', 'firstName lastName admissionNo rollNo currentClass currentSection')
    .populate('attendance.markedBy', 'name role')
    .populate('notes.studentId', 'firstName lastName admissionNo rollNo')
    .populate('notes.teacherId', 'firstName lastName employeeId')
    .populate('createdBy', 'name email role');

  if (!meeting) throw new ApiError(404, 'Parent Meeting not found');

  const meetingObj = meeting.toObject();

  // If role is parent, filter notes to parent_visible only
  if (user?.role === 'parent') {
    meetingObj.notes = (meetingObj.notes || []).filter((n) => n.visibility === 'parent_visible');
  }

  return meetingObj;
};

export const updateMeeting = async (id, schoolId, data, userId) => {
  let meeting = await ParentMeeting.findOne({ _id: id, schoolId });
  if (!meeting) throw new ApiError(404, 'Parent Meeting not found');

  let updatedFields = { ...data };

  // Re-calculate invited parents & attendance if target classes changed
  if (data.targetClasses) {
    const { invitedParents, initialAttendance } = await resolveAudienceAndAttendance(
      schoolId,
      data.targetClasses,
      data.targetSections || meeting.targetSections
    );
    updatedFields.invitedParents = invitedParents;

    // Merge existing attendance with new entries
    const existingMap = new Map();
    (meeting.attendance || []).forEach((att) => {
      const key = `${att.parentId}_${att.studentId}`;
      existingMap.set(key, att);
    });

    initialAttendance.forEach((newAtt) => {
      const key = `${newAtt.parentId}_${newAtt.studentId}`;
      if (!existingMap.has(key)) {
        existingMap.set(key, newAtt);
      }
    });

    updatedFields.attendance = Array.from(existingMap.values());
  }

  meeting = await ParentMeeting.findOneAndUpdate({ _id: id, schoolId }, updatedFields, { new: true })
    .populate('targetClasses', 'name')
    .populate('assignedTeachers', 'firstName lastName');

  if (meeting.status === 'published' || meeting.calendarEvent) {
    await syncCalendarEvent(meeting, userId);
  }

  return meeting;
};

export const publishMeeting = async (id, schoolId, userId) => {
  const meeting = await ParentMeeting.findOne({ _id: id, schoolId });
  if (!meeting) throw new ApiError(404, 'Parent Meeting not found');

  meeting.status = 'published';
  meeting.publishedAt = new Date();
  await meeting.save();

  await syncCalendarEvent(meeting, userId);
  await notifyInvitedParents(meeting);

  return meeting;
};

export const cancelMeeting = async (id, schoolId) => {
  const meeting = await ParentMeeting.findOne({ _id: id, schoolId });
  if (!meeting) throw new ApiError(404, 'Parent Meeting not found');

  meeting.status = 'cancelled';
  await meeting.save();

  await syncCalendarEvent(meeting);

  return meeting;
};

export const recordRSVP = async (id, schoolId, user, rsvpData) => {
  const meeting = await ParentMeeting.findOne({ _id: id, schoolId });
  if (!meeting) throw new ApiError(404, 'Parent Meeting not found');

  if (user.role !== 'parent' || !user.profileId) {
    throw new ApiError(403, 'Only parents can submit an RSVP');
  }

  const parentId = user.profileId;

  // Find linked student ID if not explicitly provided
  let studentId = rsvpData.studentId;
  if (!studentId) {
    const student = await Student.findOne({ schoolId, parents: parentId });
    if (student) studentId = student._id;
  }

  if (!studentId) {
    throw new ApiError(400, 'Student reference not found for RSVP');
  }

  const existingRsvpIndex = meeting.rsvps.findIndex(
    (r) => r.parentId.toString() === parentId.toString() && r.studentId.toString() === studentId.toString()
  );

  if (existingRsvpIndex > -1) {
    meeting.rsvps[existingRsvpIndex].response = rsvpData.response;
    meeting.rsvps[existingRsvpIndex].respondedAt = new Date();
  } else {
    meeting.rsvps.push({
      parentId,
      studentId,
      response: rsvpData.response,
      respondedAt: new Date(),
    });
  }

  await meeting.save();
  return meeting;
};

export const markAttendance = async (id, schoolId, user, attendanceData) => {
  const meeting = await ParentMeeting.findOne({ _id: id, schoolId });
  if (!meeting) throw new ApiError(404, 'Parent Meeting not found');

  const { parentId, studentId, status } = attendanceData;

  const existingIndex = meeting.attendance.findIndex(
    (att) => att.parentId.toString() === parentId.toString() && att.studentId.toString() === studentId.toString()
  );

  if (existingIndex > -1) {
    meeting.attendance[existingIndex].status = status;
    meeting.attendance[existingIndex].markedBy = user._id;
    meeting.attendance[existingIndex].markedAt = new Date();
  } else {
    meeting.attendance.push({
      parentId,
      studentId,
      status,
      markedBy: user._id,
      markedAt: new Date(),
    });
  }

  await meeting.save();
  return meeting;
};

export const addOrUpdateNotes = async (id, schoolId, user, noteData) => {
  const meeting = await ParentMeeting.findOne({ _id: id, schoolId });
  if (!meeting) throw new ApiError(404, 'Parent Meeting not found');

  const { studentId, academicNotes, behaviourNotes, improvementNotes, actionItems, note, visibility } = noteData;

  let teacherId = user.profileId;
  if (user.role === 'school_admin' && !teacherId) {
    teacherId = meeting.assignedTeachers?.[0] || null;
  }

  const existingIndex = meeting.notes.findIndex(
    (n) => n.studentId.toString() === studentId.toString()
  );

  const noteObj = {
    studentId,
    teacherId,
    academicNotes: academicNotes || '',
    behaviourNotes: behaviourNotes || '',
    improvementNotes: improvementNotes || '',
    actionItems: actionItems || '',
    note: note || '',
    visibility: visibility || 'parent_visible',
    createdAt: new Date(),
  };

  if (existingIndex > -1) {
    meeting.notes[existingIndex] = { ...meeting.notes[existingIndex].toObject(), ...noteObj };
  } else {
    meeting.notes.push(noteObj);
  }

  await meeting.save();
  return meeting;
};

export const exportMeetingReport = async (id, schoolId) => {
  const meeting = await ParentMeeting.findOne({ _id: id, schoolId })
    .populate('targetClasses', 'name')
    .populate('attendance.parentId', 'firstName lastName contact')
    .populate('attendance.studentId', 'firstName lastName admissionNo rollNo currentClass')
    .populate('rsvps.parentId', 'firstName lastName')
    .populate('notes.studentId', 'firstName lastName');

  if (!meeting) throw new ApiError(404, 'Parent Meeting not found');

  const rows = [['Parent Name', 'Parent Contact', 'Student Name', 'Admission No', 'Class', 'RSVP Status', 'Attendance Status', 'Meeting Notes']];

  (meeting.attendance || []).forEach((att) => {
    const parentName = att.parentId ? `${att.parentId.firstName} ${att.parentId.lastName}` : 'N/A';
    const parentContact = att.parentId?.contact?.phone || 'N/A';
    const studentName = att.studentId ? `${att.studentId.firstName} ${att.studentId.lastName}` : 'N/A';
    const admissionNo = att.studentId?.admissionNo || 'N/A';
    const className = att.studentId?.currentClass?.name || 'N/A';

    const rsvp = (meeting.rsvps || []).find(
      (r) => r.parentId?._id?.toString() === att.parentId?._id?.toString()
    );
    const rsvpStatus = rsvp ? rsvp.response : 'No Response';
    const attendanceStatus = att.status || 'pending';

    const stNote = (meeting.notes || []).find(
      (n) => n.studentId?._id?.toString() === att.studentId?._id?.toString()
    );
    const notesSummary = stNote ? [stNote.academicNotes, stNote.behaviourNotes, stNote.note].filter(Boolean).join(' | ') : 'None';

    rows.push([
      `"${parentName}"`,
      `"${parentContact}"`,
      `"${studentName}"`,
      `"${admissionNo}"`,
      `"${className}"`,
      `"${rsvpStatus}"`,
      `"${attendanceStatus}"`,
      `"${notesSummary.replace(/"/g, '""')}"`,
    ]);
  });

  const csvContent = rows.map((r) => r.join(',')).join('\n');
  return {
    filename: `PTM_Report_${meeting.title.replace(/[^a-zA-Z0-9]/g, '_')}.csv`,
    content: csvContent,
  };
};

export const deleteMeeting = async (id, schoolId) => {
  const meeting = await ParentMeeting.findOneAndDelete({ _id: id, schoolId });
  if (!meeting) throw new ApiError(404, 'Parent Meeting not found');

  if (meeting.calendarEvent) {
    await CalendarEvent.findOneAndDelete({ _id: meeting.calendarEvent, schoolId });
  }

  return true;
};

