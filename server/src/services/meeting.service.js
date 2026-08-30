import ParentMeeting from '../models/ParentMeeting.js';
import ParentMeetingClass from '../models/ParentMeetingClass.js';
import ParentMeetingTeacher from '../models/ParentMeetingTeacher.js';
import ParentMeetingParticipant from '../models/ParentMeetingParticipant.js';
import ParentMeetingNote from '../models/ParentMeetingNote.js';
import SchoolClass from '../models/SchoolClass.js';
import Section from '../models/Section.js';
import Student from '../models/Student.js';
import Parent from '../models/Parent.js';
import Teacher from '../models/Teacher.js';
import { User } from '../models/User.js';
import Event from '../models/Event.js';
import ApiError from '../utils/ApiError.js';
import { paginate } from '../utils/pagination.js';
import { createNotification } from './notification.service.js';
import { createAuditLog } from './audit.service.js';

const MEETING_TYPE_LABELS = {
  parent_teacher_meeting: 'Parent Teacher Meeting',
  academic_review: 'Academic Review',
  progress_discussion: 'Progress Discussion',
  behaviour_discussion: 'Behaviour Discussion',
  general: 'General Parent Meeting',
  other: 'Other',
};

const formatDate = (d) => {
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
};

const getParentProfile = (user) => {
  if (!user || user.role !== 'parent') return null;
  return user.profileId || null;
};

const getTeacherProfile = (user) => {
  if (!user || user.role !== 'teacher') return null;
  return user.profileId || null;
};

const syncMeetingClasses = async (schoolId, meetingId, classes) => {
  await ParentMeetingClass.deleteMany({ meetingId, schoolId });
  if (!classes?.length) return;
  await ParentMeetingClass.insertMany(
    classes.map((c) => ({
      schoolId,
      meetingId,
      schoolClass: c.classId,
      section: c.sectionId || null,
    }))
  );
};

const syncMeetingTeachers = async (schoolId, meetingId, teachers) => {
  await ParentMeetingTeacher.deleteMany({ meetingId, schoolId });
  if (!teachers?.length) return;
  await ParentMeetingTeacher.insertMany(
    teachers.map((t) => ({
      schoolId,
      meetingId,
      teacher: t.teacherId,
      schoolClass: t.classId,
      section: t.sectionId || null,
    }))
  );
};

const buildClassMatchQuery = (classes) => {
  if (!classes?.length) return null;
  return {
    $or: classes.map((c) => ({
      currentClass: c.classId,
      ...(c.sectionId ? { currentSection: c.sectionId } : {}),
    })),
  };
};

const resolveParticipants = async (schoolId, classes) => {
  const match = buildClassMatchQuery(classes);
  if (!match) return { students: [], parents: [] };

  const students = await Student.find({ schoolId, status: 'active', ...match })
    .populate('currentClass', 'name')
    .populate('currentSection', 'name');

  const parentIds = [...new Set(students.flatMap((s) => s.parents || []))];
  const parents = parentIds.length
    ? await Parent.find({ _id: { $in: parentIds }, schoolId })
    : [];

  return { students, parents };
};

const getTeacherSuggestions = async (schoolId, classes) => {
  const classIds = [...new Set(classes.map((c) => c.classId))];
  if (!classIds.length) return [];

  const schoolClasses = await SchoolClass.find({ _id: { $in: classIds }, schoolId })
    .populate('classTeacher', 'firstName lastName')
    .populate('sections', 'name')
    .populate('subjects', 'name');

  const teachers = await Teacher.find({ schoolId, status: 'active' })
    .populate('subjects', 'name')
    .select('firstName lastName employeeId department subjects assignedClasses classTeacherOf isClassTeacher');

  const classesMap = new Map(schoolClasses.map((c) => [c._id.toString(), c]));

  return classes.map(({ classId, sectionId }) => {
    const cls = classesMap.get(classId);
    const className = cls?.name || '';
    const sectionName =
      cls?.sections?.find((s) => s._id.toString() === sectionId)?.name || '';
    const classTeacher = cls?.classTeacher;

    const subjectTeacherIds = new Set();
    (cls?.subjects || []).forEach((sub) => {
      teachers.forEach((t) => {
        if ((t.subjects || []).some((s) => s._id.toString() === sub._id.toString())) {
          subjectTeacherIds.add(t._id.toString());
        }
      });
    });

    const suggestions = [];
    const seen = new Set();
    const push = (t, role) => {
      const key = t._id.toString();
      if (seen.has(key)) return;
      seen.add(key);
      suggestions.push({
        teacherId: t._id,
        name: `${t.firstName} ${t.lastName}`,
        role,
      });
    };

    if (classTeacher) push(classTeacher, 'Class Teacher');
    teachers
      .filter((t) => (t.assignedClasses || []).some((c) => c.toString() === classId))
      .forEach((t) => push(t, 'Class Teacher' === undefined ? 'Assigned' : 'Assigned'));
    teachers
      .filter((t) => subjectTeacherIds.has(t._id.toString()))
      .forEach((t) => push(t, 'Subject Teacher'));

    return { classId, sectionId, className, sectionName, suggestions };
  });
};

const buildEventPayload = (meeting, classIds = []) => ({
  title: meeting.title,
  type: 'ptm',
  description: meeting.description || `Parent meeting scheduled for ${formatDate(meeting.date)}.`,
  startDate: meeting.date,
  endDate: meeting.date,
  isFullDay: false,
  startTime: meeting.startTime,
  endTime: meeting.endTime,
  location: meeting.location || '',
  audience: 'parents',
  targetClasses: classIds,
  status: 'upcoming',
});

const notifyParents = async (meeting, action, actorId) => {
  const participants = await ParentMeetingParticipant.find({ meetingId: meeting._id, schoolId: meeting.schoolId })
    .populate('student', 'firstName lastName currentClass currentSection')
    .populate({
      path: 'student',
      populate: [
        { path: 'currentClass', select: 'name' },
        { path: 'currentSection', select: 'name' },
      ],
    });

  const parentIds = [...new Set(participants.map((p) => p.parent.toString()))];
  const users = await User.find({ profileId: { $in: parentIds }, profileModel: 'Parent', schoolId: meeting.schoolId });

  const byParent = new Map();
  participants.forEach((p) => {
    if (!byParent.has(p.parent.toString())) byParent.set(p.parent.toString(), []);
    const s = p.student;
    byParent.get(p.parent.toString()).push(
      `${s?.firstName || ''} ${s?.lastName || ''} (${s?.currentClass?.name || ''}${s?.currentSection?.name ? ` ${s.currentSection.name}` : ''})`.trim()
    );
  });

  const dateStr = formatDate(meeting.date);
  const timeStr = `${meeting.startTime} – ${meeting.endTime}`;

  for (const user of users) {
    const children = byParent.get(user.profileId.toString()) || [];
    const childLine = children.length ? `\nChild: ${children.join(', ')}` : '';
    const message =
      action === 'cancelled'
        ? `The ${meeting.title} scheduled for ${dateStr}, ${timeStr} has been cancelled.${meeting.cancelledReason ? ` Reason: ${meeting.cancelledReason}` : ''}`
        : `Your child's school has scheduled ${meeting.title} for ${dateStr}, ${timeStr}.${childLine}${meeting.location ? `\nLocation: ${meeting.location}` : ''}`;

    await createNotification(meeting.schoolId, {
      recipient: user._id,
      type: 'meeting',
      title: action === 'cancelled' ? 'Parent Meeting Cancelled' : 'Parent Teacher Meeting',
      message,
      data: { meetingId: meeting._id, entity: 'ParentMeeting', action },
    });
  }
};

const recordAudit = async ({ schoolId, actor, action, entityId, after, ip, userAgent }) => {
  try {
    await createAuditLog({ schoolId, actor, action, entity: 'ParentMeeting', entityId, after, ip, userAgent });
  } catch {
    // audit must never break the main flow
  }
};

const attachMeetingDetails = async (schoolId, meetings) => {
  if (!meetings.length) return [];
  const ids = meetings.map((m) => m._id);

  const [classRows, teacherRows, participantGroups, parentGroups] = await Promise.all([
    ParentMeetingClass.find({ meetingId: { $in: ids }, schoolId })
      .populate('schoolClass', 'name')
      .populate('section', 'name'),
    ParentMeetingTeacher.find({ meetingId: { $in: ids }, schoolId })
      .populate('teacher', 'firstName lastName'),
    ParentMeetingParticipant.aggregate([
      { $match: { meetingId: { $in: ids }, schoolId } },
      { $group: { _id: '$meetingId', count: { $sum: 1 } } },
    ]),
    ParentMeetingParticipant.aggregate([
      { $match: { meetingId: { $in: ids }, schoolId } },
      { $group: { _id: '$meetingId', parents: { $addToSet: '$parent' } } },
    ]),
  ]);

  const classMap = new Map();
  classRows.forEach((r) => {
    const key = r.meetingId.toString();
    if (!classMap.has(key)) classMap.set(key, []);
    classMap.get(key).push({
      classId: r.schoolClass?._id,
      className: r.schoolClass?.name || '',
      sectionId: r.section?._id,
      sectionName: r.section?.name || '',
    });
  });

  const teacherCountMap = new Map();
  teacherRows.forEach((r) => {
    const key = r.meetingId.toString();
    if (!teacherCountMap.has(key)) teacherCountMap.set(key, new Set());
    teacherCountMap.get(key).add(r.teacher?._id?.toString());
  });

  const participantCountMap = new Map(participantGroups.map((g) => [g._id.toString(), g.count]));
  const parentCountMap = new Map(parentGroups.map((g) => [g._id.toString(), g.parents.length]));

  return meetings.map((m) => {
    const obj = m.toObject ? m.toObject() : { ...m };
    obj.classes = classMap.get(m._id.toString()) || [];
    obj.teachersCount = teacherCountMap.get(m._id.toString())?.size || 0;
    obj.participantsCount = participantCountMap.get(m._id.toString()) || 0;
    obj.parentsInvited = parentCountMap.get(m._id.toString()) || 0;
    obj.typeLabel = MEETING_TYPE_LABELS[obj.type] || obj.type;
    return obj;
  });
};

export const createMeeting = async (schoolId, data, userId) => {
  const meeting = await ParentMeeting.create({
    schoolId,
    title: data.title,
    type: data.type,
    description: data.description || '',
    date: new Date(data.date),
    startTime: data.startTime,
    endTime: data.endTime,
    location: data.location || '',
    instructions: data.instructions || '',
    status: 'DRAFT',
    createdBy: userId,
  });

  await syncMeetingClasses(schoolId, meeting._id, data.classes);
  await syncMeetingTeachers(schoolId, meeting._id, data.teachers || []);
  return meeting;
};

export const updateMeeting = async (id, schoolId, data, userId) => {
  const meeting = await ParentMeeting.findOne({ _id: id, schoolId });
  if (!meeting) throw new ApiError(404, 'Meeting not found');

  const wasPublished = meeting.status === 'PUBLISHED';
  const dateChanged = data.date !== undefined && formatDate(data.date) !== formatDate(meeting.date);
  const startChanged = data.startTime !== undefined && data.startTime !== meeting.startTime;
  const endChanged = data.endTime !== undefined && data.endTime !== meeting.endTime;
  const locationChanged = data.location !== undefined && data.location !== (meeting.location || '');

  const fields = ['title', 'type', 'description', 'date', 'startTime', 'endTime', 'location', 'instructions'];
  const changed = {};
  fields.forEach((f) => {
    if (data[f] !== undefined) {
      if (f === 'date') changed[f] = new Date(data[f]);
      else changed[f] = data[f];
    }
  });

  if (Object.keys(changed).length) {
    Object.assign(meeting, changed);
    await meeting.save();
  }

  if (data.classes) await syncMeetingClasses(schoolId, meeting._id, data.classes);
  if (data.teachers) await syncMeetingTeachers(schoolId, meeting._id, data.teachers);

  if (wasPublished) {
    const dateOrTimeChanged = dateChanged || startChanged || endChanged || locationChanged;

    if (meeting.eventId) {
      const classRows = await ParentMeetingClass.find({ meetingId: meeting._id, schoolId });
      const classIds = classRows.map((r) => r.schoolClass);
      await Event.findOneAndUpdate(
        { _id: meeting.eventId, schoolId },
        { $set: buildEventPayload(meeting, classIds) },
        { new: true, runValidators: true }
      );
    }

    if (dateOrTimeChanged) {
      try {
        await notifyParents(meeting, 'updated', userId);
      } catch {
        // notification failure must not block the update
      }
    }
  }

  return meeting;
};

export const deleteMeeting = async (id, schoolId, userId) => {
  const meeting = await ParentMeeting.findOne({ _id: id, schoolId });
  if (!meeting) throw new ApiError(404, 'Meeting not found');
  if (meeting.status !== 'DRAFT' && meeting.status !== 'CANCELLED') {
    throw new ApiError(400, 'Only draft or cancelled meetings can be deleted');
  }

  if (meeting.eventId) {
    await Event.deleteOne({ _id: meeting.eventId, schoolId });
  }
  await Promise.all([
    ParentMeetingClass.deleteMany({ meetingId: id, schoolId }),
    ParentMeetingTeacher.deleteMany({ meetingId: id, schoolId }),
    ParentMeetingParticipant.deleteMany({ meetingId: id, schoolId }),
    ParentMeetingNote.deleteMany({ meetingId: id, schoolId }),
  ]);
  await ParentMeeting.deleteOne({ _id: id, schoolId });
  return true;
};

export const getMeetings = async (schoolId, options, user) => {
  const {
    search, status, type, classId, teacherId, dateFrom, dateTo, academicYearId,
    page, limit, sort,
  } = options;

  const filterQuery = { schoolId };
  const andConditions = [];

  if (status && status !== 'all') filterQuery.status = status;
  if (type && type !== 'all') filterQuery.type = type;
  if (dateFrom) filterQuery.date = { ...(filterQuery.date || {}), $gte: new Date(dateFrom) };
  if (dateTo) filterQuery.date = { ...(filterQuery.date || {}), $lte: new Date(dateTo) };

  const role = user?.role;
  let scopedMeetingIds = null;

  if (role === 'teacher') {
    const teacherIdProfile = getTeacherProfile(user);
    scopedMeetingIds = await ParentMeetingTeacher.find({ schoolId, teacher: teacherIdProfile }).distinct('meetingId');
  } else if (role === 'parent') {
    const parentId = getParentProfile(user);
    scopedMeetingIds = await ParentMeetingParticipant.find({ schoolId, parent: parentId }).distinct('meetingId');
    filterQuery.status = { $in: ['PUBLISHED', 'COMPLETED', 'CANCELLED'] };
  }

  if (classId) {
    const ids = await ParentMeetingClass.find({ schoolId, schoolClass: classId }).distinct('meetingId');
    andConditions.push({ _id: { $in: ids } });
  }

  if (teacherId) {
    const ids = await ParentMeetingTeacher.find({ schoolId, teacher: teacherId }).distinct('meetingId');
    andConditions.push({ _id: { $in: ids } });
  }

  if (academicYearId) {
    const classIds = await SchoolClass.find({ schoolId, academicYear: academicYearId }).distinct('_id');
    const ids = await ParentMeetingClass.find({ schoolId, schoolClass: { $in: classIds } }).distinct('meetingId');
    andConditions.push({ _id: { $in: ids } });
  }

  if (scopedMeetingIds) {
    andConditions.push({ _id: { $in: scopedMeetingIds } });
  }

  if (andConditions.length) filterQuery.$and = andConditions;

  const result = await paginate(ParentMeeting, filterQuery, {
    page,
    limit,
    sort: sort || '-date',
    search,
    searchFields: ['title', 'type', 'location'],
  });

  const decorated = await attachMeetingDetails(schoolId, result.data);

  if (role === 'parent' && decorated.length) {
    const parentId = getParentProfile(user);
    const myRows = await ParentMeetingParticipant.find({
      meetingId: { $in: decorated.map((m) => m._id) },
      schoolId,
      parent: parentId,
    }).select('meetingId rsvpStatus');
    const rsvpMap = new Map();
    myRows.forEach((r) => {
      rsvpMap.set(r.meetingId.toString(), r.rsvpStatus);
    });
    decorated.forEach((m) => {
      m.myRsvp = rsvpMap.get(m._id.toString()) || 'PENDING';
    });
  }

  return { ...result, data: decorated };
};

export const getMeetingStats = async (schoolId, user) => {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const tomorrowStart = new Date(todayStart);
  tomorrowStart.setDate(tomorrowStart.getDate() + 1);

  let scopeFilter = {};
  if (user?.role === 'teacher') {
    const teacherId = getTeacherProfile(user);
    const ids = await ParentMeetingTeacher.find({ schoolId, teacher: teacherId }).distinct('meetingId');
    scopeFilter._id = { $in: ids };
  }

  const [upcoming, today, completed, publishedCompletedMeetings] = await Promise.all([
    ParentMeeting.countDocuments({
      schoolId, ...scopeFilter,
      status: 'PUBLISHED',
      date: { $gte: todayStart },
    }),
    ParentMeeting.countDocuments({
      schoolId, ...scopeFilter,
      status: 'PUBLISHED',
      date: { $gte: todayStart, $lt: tomorrowStart },
    }),
    ParentMeeting.countDocuments({ schoolId, ...scopeFilter, status: 'COMPLETED' }),
    ParentMeeting.find({ schoolId, ...scopeFilter, status: { $in: ['PUBLISHED', 'COMPLETED'] } }).distinct('_id'),
  ]);

  const parentRows = publishedCompletedMeetings.length
    ? await ParentMeetingParticipant.aggregate([
        { $match: { meetingId: { $in: publishedCompletedMeetings }, schoolId } },
        { $group: { _id: null, parents: { $addToSet: '$parent' } } },
      ])
    : [];

  return {
    upcoming,
    today,
    completed,
    parentsInvited: parentRows[0]?.parents?.length || 0,
  };
};

export const previewMeeting = async (schoolId, { classes }) => {
  const { students, parents } = await resolveParticipants(schoolId, classes);
  const suggestions = await getTeacherSuggestions(schoolId, classes);

  const parentMap = new Map(parents.map((p) => [p._id.toString(), p]));
  const studentMap = new Map(students.map((s) => [s._id.toString(), s]));

  const parentsWithChildren = [];
  parents.forEach((p) => {
    const children = (p.students || [])
      .map((sid) => studentMap.get(sid.toString()))
      .filter(Boolean)
      .map((s) => ({
        studentId: s._id,
        firstName: s.firstName,
        lastName: s.lastName,
        className: s.currentClass?.name || '',
        sectionName: s.currentSection?.name || '',
      }));
    parentsWithChildren.push({
      parentId: p._id,
      firstName: p.firstName,
      lastName: p.lastName,
      children,
    });
  });

  return {
    studentsCount: students.length,
    parentsCount: parents.length,
    parentsWithChildren,
    teacherSuggestions: suggestions,
  };
};

export const getMeetingById = async (id, schoolId, user) => {
  const meeting = await ParentMeeting.findOne({ _id: id, schoolId });
  if (!meeting) throw new ApiError(404, 'Meeting not found');

  const role = user?.role;
  const teacherProfileId = getTeacherProfile(user);
  const parentProfileId = getParentProfile(user);

  if (role === 'teacher') {
    const assigned = await ParentMeetingTeacher.exists({ meetingId: id, schoolId, teacher: teacherProfileId });
    if (!assigned) throw new ApiError(403, 'You are not assigned to this meeting');
  }

  if (role === 'parent') {
    if (meeting.status === 'DRAFT') throw new ApiError(403, 'This meeting is not available');
    const isParticipant = await ParentMeetingParticipant.exists({ meetingId: id, schoolId, parent: parentProfileId });
    if (!isParticipant) throw new ApiError(403, 'You are not invited to this meeting');
  }

  const [classRows, teacherRows, participantRows, noteRows, event] = await Promise.all([
    ParentMeetingClass.find({ meetingId: id, schoolId })
      .populate('schoolClass', 'name')
      .populate('section', 'name'),
    ParentMeetingTeacher.find({ meetingId: id, schoolId })
      .populate('teacher', 'firstName lastName')
      .populate('schoolClass', 'name')
      .populate('section', 'name'),
    ParentMeetingParticipant.find({ meetingId: id, schoolId })
      .populate('parent', 'firstName lastName contact')
      .populate({
        path: 'student',
        select: 'firstName lastName admissionNo currentClass currentSection',
        populate: [
          { path: 'currentClass', select: 'name' },
          { path: 'currentSection', select: 'name' },
        ],
      }),
    ParentMeetingNote.find({ meetingId: id, schoolId })
      .populate('teacher', 'firstName lastName')
      .populate('student', 'firstName lastName')
      .populate('createdBy', 'name role'),
    meeting.eventId ? Event.findOne({ _id: meeting.eventId, schoolId }) : null,
  ]);

  let classes = classRows.map((r) => ({
    classId: r.schoolClass?._id,
    className: r.schoolClass?.name || '',
    sectionId: r.section?._id,
    sectionName: r.section?.name || '',
  }));

  const teachers = teacherRows.map((r) => ({
    teacherId: r.teacher?._id,
    name: r.teacher ? `${r.teacher.firstName} ${r.teacher.lastName}` : '',
    className: r.schoolClass?.name || '',
    sectionName: r.section?.name || '',
  }));

  let participants = participantRows.map((p) => ({
    participantId: p._id,
    parentId: p.parent?._id,
    parentName: p.parent ? `${p.parent.firstName} ${p.parent.lastName}` : '',
    parentPhone: p.parent?.contact?.phone || '',
    studentId: p.student?._id,
    studentName: p.student ? `${p.student.firstName} ${p.student.lastName}` : '',
    studentClassId: p.student?.currentClass?._id,
    studentSectionId: p.student?.currentSection?._id,
    className: p.student?.currentClass?.name || '',
    sectionName: p.student?.currentSection?.name || '',
    rsvpStatus: p.rsvpStatus,
    attendanceStatus: p.attendanceStatus,
    invitedAt: p.invitedAt,
    respondedAt: p.respondedAt,
    attendedAt: p.attendedAt,
  }));

  let notes = noteRows.map((n) => ({
    noteId: n._id,
    studentId: n.student?._id,
    studentName: n.student ? `${n.student.firstName} ${n.student.lastName}` : '',
    teacherId: n.teacher?._id,
    teacherName: n.teacher ? `${n.teacher.firstName} ${n.teacher.lastName}` : '',
    note: n.note,
    visibility: n.visibility,
    createdByName: n.createdBy?.name || '',
    createdAt: n.createdAt,
    updatedAt: n.updatedAt,
  }));

  if (role === 'parent') {
    const allowedStudents = new Set(participants.map((p) => p.studentId?.toString()));
    notes = notes.filter((n) => n.visibility === 'PARENT_VISIBLE' && allowedStudents.has(n.studentId?.toString()));
  }

  if (role === 'teacher') {
    const scopes = await getTeacherScopeClasses(id, schoolId, teacherProfileId);
    participants = participants.filter((p) =>
      scopes.some(
        (s) =>
          s.classId === p.studentClassId?.toString() &&
          (!s.sectionId || s.sectionId === p.studentSectionId?.toString())
      )
    );
  }

  const totalParticipants = participants.length;
  const rsvpBreakdown = {
    PENDING: participants.filter((p) => p.rsvpStatus === 'PENDING').length,
    GOING: participants.filter((p) => p.rsvpStatus === 'GOING').length,
    MAYBE: participants.filter((p) => p.rsvpStatus === 'MAYBE').length,
    NOT_GOING: participants.filter((p) => p.rsvpStatus === 'NOT_GOING').length,
  };
  const attendanceBreakdown = {
    PENDING: participants.filter((p) => p.attendanceStatus === 'PENDING').length,
    ATTENDED: participants.filter((p) => p.attendanceStatus === 'ATTENDED').length,
    ABSENT: participants.filter((p) => p.attendanceStatus === 'ABSENT').length,
  };
  const attended = attendanceBreakdown.ATTENDED;
  const attendanceRate = totalParticipants
    ? Math.round((attended / totalParticipants) * 1000) / 10
    : 0;

  const obj = meeting.toObject();
  obj.typeLabel = MEETING_TYPE_LABELS[obj.type] || obj.type;
  obj.classes = classes;
  obj.teachers = teachers;
  obj.participants = participants;
  obj.notes = notes;
  obj.rsvpBreakdown = rsvpBreakdown;
  obj.attendanceBreakdown = attendanceBreakdown;
  obj.totalParticipants = totalParticipants;
  obj.parentsInvited = new Set(participants.map((p) => p.parentId?.toString())).size;
  obj.attendanceRate = attendanceRate;
  obj.event = event;
  obj.permissions = {
    canEdit: role === 'school_admin' && meeting.status === 'DRAFT',
    canPublish: role === 'school_admin' && meeting.status === 'DRAFT',
    canCancel: role === 'school_admin' && meeting.status === 'PUBLISHED',
    canComplete: role === 'school_admin' && meeting.status === 'PUBLISHED',
    canDelete: role === 'school_admin' && (meeting.status === 'DRAFT' || meeting.status === 'CANCELLED'),
    canManageAttendance: role === 'school_admin' || (role === 'teacher' && meeting.status !== 'DRAFT'),
    canAddNotes: (role === 'school_admin' || role === 'teacher') && meeting.status !== 'DRAFT',
    canRsvp: role === 'parent' && meeting.status === 'PUBLISHED',
  };

  return obj;
};

export const publishMeeting = async (id, schoolId, user, ip, userAgent) => {
  const meeting = await ParentMeeting.findOne({ _id: id, schoolId });
  if (!meeting) throw new ApiError(404, 'Meeting not found');
  if (meeting.status !== 'DRAFT') throw new ApiError(400, 'Only draft meetings can be published');

  const classRows = await ParentMeetingClass.find({ meetingId: id, schoolId });
  if (!classRows.length) throw new ApiError(400, 'Meeting must have at least one class');

  const classes = classRows.map((r) => ({ classId: r.schoolClass.toString(), sectionId: r.section?.toString() || null }));
  const { students, parents } = await resolveParticipants(schoolId, classes);

  const now = new Date();
  const participantDocs = [];
  students.forEach((s) => {
    (s.parents || []).forEach((parentId) => {
      participantDocs.push({
        schoolId,
        meetingId: id,
        parent: parentId,
        student: s._id,
        rsvpStatus: 'PENDING',
        attendanceStatus: 'PENDING',
        invitedAt: now,
      });
    });
  });
  await ParentMeetingParticipant.deleteMany({ meetingId: id, schoolId });
  if (participantDocs.length) {
    await ParentMeetingParticipant.insertMany(participantDocs);
  }

  const classIds = classRows.map((r) => r.schoolClass);
  const event = await Event.create({
    ...buildEventPayload(meeting, classIds),
    schoolId,
    createdBy: user._id,
  });

  meeting.eventId = event._id;
  meeting.status = 'PUBLISHED';
  meeting.publishedAt = now;
  meeting.cancelledAt = undefined;
  meeting.cancelledReason = '';
  await meeting.save();

  await notifyParents(meeting, 'published', user._id).catch(() => {});
  await recordAudit({ schoolId, actor: user._id, action: 'meeting_published', entityId: id, after: { status: 'PUBLISHED' }, ip, userAgent });

  const fresh = await getMeetingById(id, schoolId, user);
  return fresh;
};

export const cancelMeeting = async (id, schoolId, user, reason, ip, userAgent) => {
  const meeting = await ParentMeeting.findOne({ _id: id, schoolId });
  if (!meeting) throw new ApiError(404, 'Meeting not found');
  if (meeting.status !== 'PUBLISHED') throw new ApiError(400, 'Only published meetings can be cancelled');

  meeting.status = 'CANCELLED';
  meeting.cancelledAt = new Date();
  meeting.cancelledReason = reason || '';
  await meeting.save();

  if (meeting.eventId) {
    await Event.findOneAndUpdate(
      { _id: meeting.eventId, schoolId },
      { $set: { status: 'cancelled' } },
      { new: true }
    );
  }

  await notifyParents(meeting, 'cancelled', user._id).catch(() => {});
  await recordAudit({ schoolId, actor: user._id, action: 'meeting_cancelled', entityId: id, after: { status: 'CANCELLED' }, ip, userAgent });

  const fresh = await getMeetingById(id, schoolId, user);
  return fresh;
};

export const completeMeeting = async (id, schoolId, user, ip, userAgent) => {
  const meeting = await ParentMeeting.findOne({ _id: id, schoolId });
  if (!meeting) throw new ApiError(404, 'Meeting not found');
  if (meeting.status !== 'PUBLISHED') throw new ApiError(400, 'Only published meetings can be completed');

  const now = new Date();
  const endOfMeetingDay = new Date(meeting.date);
  endOfMeetingDay.setHours(23, 59, 59, 999);
  if (now < endOfMeetingDay) {
    throw new ApiError(400, 'Meeting date has not passed yet');
  }

  meeting.status = 'COMPLETED';
  meeting.completedAt = now;
  await meeting.save();

  if (meeting.eventId) {
    await Event.findOneAndUpdate(
      { _id: meeting.eventId, schoolId },
      { $set: { status: 'completed' } },
      { new: true }
    );
  }

  await recordAudit({ schoolId, actor: user._id, action: 'meeting_completed', entityId: id, after: { status: 'COMPLETED' }, ip, userAgent });

  const fresh = await getMeetingById(id, schoolId, user);
  return fresh;
};

export const rsvpMeeting = async (id, schoolId, parentProfileId, rsvpStatus) => {
  if (!parentProfileId) throw new ApiError(403, 'Parent profile not found');

  const meeting = await ParentMeeting.findOne({ _id: id, schoolId });
  if (!meeting) throw new ApiError(404, 'Meeting not found');
  if (meeting.status !== 'PUBLISHED') throw new ApiError(400, 'RSVP is only available for published meetings');

  const result = await ParentMeetingParticipant.updateMany(
    { meetingId: id, schoolId, parent: parentProfileId },
    { $set: { rsvpStatus, respondedAt: new Date() } },
    { runValidators: true }
  );
  if (result.modifiedCount === 0 && result.matchedCount === 0) {
    const exists = await ParentMeetingParticipant.exists({ meetingId: id, schoolId, parent: parentProfileId });
    if (!exists) throw new ApiError(403, 'You are not invited to this meeting');
  }

  return { rsvpStatus, respondedAt: new Date() };
};

const getTeacherScopeClasses = async (meetingId, schoolId, teacherProfileId) => {
  const assigned = await ParentMeetingTeacher.find({ meetingId: meetingId, schoolId, teacher: teacherProfileId })
    .select('schoolClass section');
  return assigned.map((a) => ({
    classId: a.schoolClass.toString(),
    sectionId: a.section ? a.section.toString() : null,
  }));
};

const isParticipantInScope = (participant, scopes) => {
  if (!scopes) return true;
  return scopes.some(
    (s) =>
      s.classId === participant.student.currentClass?.toString() &&
      (!s.sectionId || s.sectionId === participant.student.currentSection?.toString())
  );
};

const assertAttendancePermission = async (meetingId, schoolId, user, participants) => {
  if (user.role === 'school_admin') return;
  if (user.role !== 'teacher') throw new ApiError(403, 'Insufficient permissions');

  const teacherProfileId = getTeacherProfile(user);
  if (!teacherProfileId) throw new ApiError(403, 'Teacher profile not found');

  const scopes = await getTeacherScopeClasses(meetingId, schoolId, teacherProfileId);
  if (!scopes.length) throw new ApiError(403, 'You are not assigned to this meeting');

  const populated = await ParentMeetingParticipant.find({ _id: { $in: participants.map((p) => p.participantId) } })
    .populate('student', 'currentClass currentSection');

  const allowed = new Set(
    populated
      .filter((p) => isParticipantInScope(p, scopes))
      .map((p) => p._id.toString())
  );

  participants.forEach((p) => {
    if (!allowed.has(p.participantId)) {
      throw new ApiError(403, 'You can only update attendance for students in your assigned classes');
    }
  });
};

export const markAttendance = async (id, schoolId, data, user) => {
  const meeting = await ParentMeeting.findOne({ _id: id, schoolId });
  if (!meeting) throw new ApiError(404, 'Meeting not found');

  const participant = await ParentMeetingParticipant.findOne({ _id: data.participantId, meetingId: id, schoolId });
  if (!participant) throw new ApiError(404, 'Participant not found');

  await assertAttendancePermission(id, schoolId, user, [{ participantId: data.participantId }]);

  participant.attendanceStatus = data.status;
  participant.markedBy = user._id;
  participant.markedAt = new Date();
  if (data.status === 'ATTENDED') participant.attendedAt = new Date();
  if (data.status === 'ABSENT') participant.attendedAt = undefined;
  await participant.save();

  return { participantId: participant._id, status: participant.attendanceStatus };
};

export const bulkMarkAttendance = async (id, schoolId, updates, user) => {
  const meeting = await ParentMeeting.findOne({ _id: id, schoolId });
  if (!meeting) throw new ApiError(404, 'Meeting not found');

  const uniqueUpdates = [...new Map(updates.map((u) => [u.participantId, u])).values()];
  const participantIds = uniqueUpdates.map((u) => u.participantId);
  const participants = await ParentMeetingParticipant.find({ _id: { $in: participantIds }, meetingId: id, schoolId });
  if (participants.length !== participantIds.length) {
    throw new ApiError(400, 'One or more participants are not part of this meeting');
  }

  await assertAttendancePermission(id, schoolId, user, uniqueUpdates);

  const now = new Date();
  const ops = uniqueUpdates.map((u) => ({
    updateOne: {
      filter: { _id: u.participantId, meetingId: id, schoolId },
      update: {
        $set: {
          attendanceStatus: u.status,
          markedBy: user._id,
          markedAt: now,
          ...(u.status === 'ATTENDED' ? { attendedAt: now } : { attendedAt: undefined }),
        },
      },
    },
  }));
  await ParentMeetingParticipant.bulkWrite(ops);

  return { updated: uniqueUpdates.length };
};

export const addNote = async (id, schoolId, data, user) => {
  const meeting = await ParentMeeting.findOne({ _id: id, schoolId });
  if (!meeting) throw new ApiError(404, 'Meeting not found');
  if (meeting.status === 'DRAFT') throw new ApiError(400, 'Notes cannot be added to draft meetings');

  const participant = await ParentMeetingParticipant.findOne({ meetingId: id, schoolId, student: data.studentId });
  if (!participant) throw new ApiError(404, 'Student is not part of this meeting');

  if (user.role === 'teacher') {
    await assertAttendancePermission(id, schoolId, user, [{ participantId: participant._id.toString() }]);
  } else if (user.role !== 'school_admin') {
    throw new ApiError(403, 'Insufficient permissions');
  }

  const teacherProfileId = user.role === 'teacher' ? getTeacherProfile(user) : null;
  const note = await ParentMeetingNote.create({
    schoolId,
    meetingId: id,
    student: data.studentId,
    teacher: teacherProfileId,
    note: data.note,
    visibility: data.visibility || 'INTERNAL',
    createdBy: user._id,
  });

  await recordAudit({ schoolId, actor: user._id, action: 'meeting_note_added', entityId: id, after: { noteId: note._id, studentId: data.studentId, visibility: note.visibility }, ip: user?.ip, userAgent: user?.userAgent });

  return note;
};

export const updateNote = async (noteId, id, schoolId, data, user) => {
  const note = await ParentMeetingNote.findOne({ _id: noteId, meetingId: id, schoolId });
  if (!note) throw new ApiError(404, 'Note not found');

  if (user.role !== 'school_admin' && note.createdBy?.toString() !== user._id.toString()) {
    throw new ApiError(403, 'Only the note author or an admin can edit this note');
  }

  if (data.note !== undefined) note.note = data.note;
  if (data.visibility !== undefined) note.visibility = data.visibility;
  await note.save();
  return note;
};

export const deleteNote = async (noteId, id, schoolId, user) => {
  const note = await ParentMeetingNote.findOne({ _id: noteId, meetingId: id, schoolId });
  if (!note) throw new ApiError(404, 'Note not found');

  if (user.role !== 'school_admin' && note.createdBy?.toString() !== user._id.toString()) {
    throw new ApiError(403, 'Only the note author or an admin can delete this note');
  }

  await ParentMeetingNote.deleteOne({ _id: noteId, meetingId: id, schoolId });
  return true;
};

export const getMeetingParticipants = async (id, schoolId, user) => {
  const meeting = await ParentMeeting.findOne({ _id: id, schoolId });
  if (!meeting) throw new ApiError(404, 'Meeting not found');

  if (user.role === 'teacher') {
    const teacherProfileId = getTeacherProfile(user);
    const scopes = await getTeacherScopeClasses(id, schoolId, teacherProfileId);
    if (!scopes.length) throw new ApiError(403, 'You are not assigned to this meeting');

    const participants = await ParentMeetingParticipant.find({ meetingId: id, schoolId })
      .populate('parent', 'firstName lastName contact')
      .populate({
        path: 'student',
        select: 'firstName lastName currentClass currentSection',
        populate: [
          { path: 'currentClass', select: 'name' },
          { path: 'currentSection', select: 'name' },
        ],
      });

    return participants
      .filter((p) => isParticipantInScope(p, scopes))
      .map((p) => ({
        participantId: p._id,
        parentId: p.parent?._id,
        parentName: p.parent ? `${p.parent.firstName} ${p.parent.lastName}` : '',
        parentPhone: p.parent?.contact?.phone || '',
        studentId: p.student?._id,
        studentName: p.student ? `${p.student.firstName} ${p.student.lastName}` : '',
        className: p.student?.currentClass?.name || '',
        sectionName: p.student?.currentSection?.name || '',
        rsvpStatus: p.rsvpStatus,
        attendanceStatus: p.attendanceStatus,
      }));
  }

  if (user.role === 'parent') {
    const parentProfileId = getParentProfile(user);
    const participants = await ParentMeetingParticipant.find({ meetingId: id, schoolId, parent: parentProfileId })
      .populate('parent', 'firstName lastName contact')
      .populate({
        path: 'student',
        select: 'firstName lastName currentClass currentSection',
        populate: [
          { path: 'currentClass', select: 'name' },
          { path: 'currentSection', select: 'name' },
        ],
      });
    return participants.map((p) => ({
      participantId: p._id,
      parentId: p.parent?._id,
      parentName: p.parent ? `${p.parent.firstName} ${p.parent.lastName}` : '',
      studentId: p.student?._id,
      studentName: p.student ? `${p.student.firstName} ${p.student.lastName}` : '',
      className: p.student?.currentClass?.name || '',
      sectionName: p.student?.currentSection?.name || '',
      rsvpStatus: p.rsvpStatus,
      attendanceStatus: p.attendanceStatus,
    }));
  }

  const participants = await ParentMeetingParticipant.find({ meetingId: id, schoolId })
    .populate('parent', 'firstName lastName contact')
    .populate({
      path: 'student',
      select: 'firstName lastName currentClass currentSection',
      populate: [
        { path: 'currentClass', select: 'name' },
        { path: 'currentSection', select: 'name' },
      ],
    });
  return participants.map((p) => ({
    participantId: p._id,
    parentId: p.parent?._id,
    parentName: p.parent ? `${p.parent.firstName} ${p.parent.lastName}` : '',
    parentPhone: p.parent?.contact?.phone || '',
    studentId: p.student?._id,
    studentName: p.student ? `${p.student.firstName} ${p.student.lastName}` : '',
    className: p.student?.currentClass?.name || '',
    sectionName: p.student?.currentSection?.name || '',
    rsvpStatus: p.rsvpStatus,
    attendanceStatus: p.attendanceStatus,
  }));
};