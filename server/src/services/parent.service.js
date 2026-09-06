import crypto from 'crypto';
import Parent from '../models/Parent.js';
import { User } from '../models/User.js';
import School from '../models/School.js';
import AccountToken from '../models/AccountToken.js';
import AuditLog from '../models/AuditLog.js';
import Student from '../models/Student.js';
import Attendance from '../models/Attendance.js';
import Homework from '../models/Homework.js';
import Exam from '../models/Exam.js';
import Mark from '../models/Mark.js';
import FeeTransaction from '../models/FeeTransaction.js';
import Timetable from '../models/Timetable.js';
import Notice from '../models/Notice.js';
import Event from '../models/Event.js';
import RecognitionPoint from '../models/RecognitionPoint.js';
import Leave from '../models/Leave.js';
import ParentMeeting from '../models/ParentMeeting.js';
import ParentMeetingClass from '../models/ParentMeetingClass.js';
import ParentMeetingParticipant from '../models/ParentMeetingParticipant.js';
import ApiError from '../utils/ApiError.js';
import { paginate } from '../utils/pagination.js';
import env from '../config/env.js';
import Setting from '../models/Setting.js';
import { sendEmail } from './brevoMail.service.js';
import { getParentActivationEmailTemplate } from './emailTemplates/parentActivation.template.js';


export const createParent = async (schoolId, data) => {
  const parent = await Parent.create({ ...data, schoolId });
  return parent;
};

export const getParents = async (schoolId, options) => {
  return paginate(Parent, { schoolId }, { ...options, searchFields: ['firstName', 'lastName', 'contact.phone'] });
};

export const getParentById = async (id, schoolId) => {
  const parent = await Parent.findOne({ _id: id, schoolId }).populate('students', 'firstName lastName admissionNo currentClass');
  if (!parent) throw new ApiError(404, 'Parent not found');
  return parent;
};

export const updateParent = async (id, schoolId, data) => {
  const parent = await Parent.findOneAndUpdate({ _id: id, schoolId }, data, { new: true });
  if (!parent) throw new ApiError(404, 'Parent not found');
  return parent;
};

export const resendParentActivationEmail = async (parentId, schoolId, adminUserId, ip, userAgent) => {
  const parent = await Parent.findOne({ _id: parentId, schoolId }).populate({
    path: 'students',
    populate: [
      { path: 'currentClass', select: 'name' },
      { path: 'currentSection', select: 'name' }
    ]
  });

  if (!parent) throw new ApiError(404, 'Parent record not found');

  const parentEmail = parent.contact?.email;
  if (!parentEmail) {
    throw new ApiError(400, 'Parent has no email address configured.');
  }

  const normalizedEmail = parentEmail.toLowerCase().trim();
  let user = await User.findOne({ email: normalizedEmail });

  if (!user) {
    const tempPassword = crypto.randomBytes(24).toString('hex');
    user = await User.create({
      schoolId,
      email: normalizedEmail,
      password: tempPassword,
      role: 'parent',
      profileId: parent._id,
      profileModel: 'Parent',
      name: `${parent.firstName} ${parent.lastName}`.trim(),
      phone: parent.contact?.phone,
      status: 'pending_activation',
      isActive: false,
      emailVerified: false,
    });
  }

  if (user.status === 'active' && user.emailVerified) {
    throw new ApiError(400, 'This parent account is already active and verified.');
  }

  // Invalidate any previous activation tokens
  await AccountToken.updateMany(
    { userId: user._id, type: 'activation', usedAt: null },
    { usedAt: new Date() }
  );

  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  const accountToken = await AccountToken.create({
    tokenHash,
    userId: user._id,
    type: 'activation',
    expiresAt,
    emailDeliveryStatus: 'pending'
  });

  const school = await School.findById(schoolId);
  const student = parent.students?.[0];
  const studentName = student ? `${student.firstName} ${student.lastName}`.trim() : 'Student';
  const className = student?.currentClass ? `${student.currentClass.name} ${student.currentSection?.name ? `- Section ${student.currentSection.name}` : ''}`.trim() : 'General';
  const parentName = `${parent.firstName} ${parent.lastName}`.trim() || user.name || 'Parent';
  const activationUrl = `${env.CLIENT_URL}/activate-account?token=${rawToken}`;

  const emailHtml = getParentActivationEmailTemplate({
    parentName,
    schoolName: school?.name || 'Instique School',
    studentName,
    className,
    activationUrl,
    expiryHours: 24
  });

  const emailResult = await sendEmail(
    user.email,
    'Welcome to Instique — Set Up Your Parent Account',
    emailHtml,
    parentName
  );

  if (!emailResult.success) {
    await AccountToken.findByIdAndUpdate(accountToken._id, {
      emailDeliveryStatus: 'failed',
      emailDeliveryError: emailResult.error
    });
    throw new ApiError(500, 'Unable to send the activation email. Please try again.');
  }

  await AccountToken.findByIdAndUpdate(accountToken._id, { emailDeliveryStatus: 'sent' });

  await AuditLog.create({
    schoolId,
    actor: adminUserId,
    action: 'resend_parent_activation',
    entity: 'User',
    entityId: user._id,
    ip,
    userAgent,
    after: { email: user.email }
  });

  return { success: true, message: `Activation email sent successfully to ${user.email}` };
};

export const getParentForUser = async (user, schoolId) => {
  if (!user) throw new ApiError(401, 'Authentication required');

  let parent = null;
  if (user.profileId) {
    parent = await Parent.findOne({ _id: user.profileId, schoolId });
  }

  if (!parent && user.email) {
    parent = await Parent.findOne({ schoolId, 'contact.email': user.email.toLowerCase().trim() });
  }

  if (!parent && user.phone) {
    parent = await Parent.findOne({ schoolId, 'contact.phone': user.phone });
  }

  if (!parent) {
    throw new ApiError(404, 'No parent profile associated with your user account');
  }

  return parent;
};

export const getMyChildren = async (user, schoolId) => {
  const parent = await getParentForUser(user, schoolId);

  // Find all active/promoted students belonging to this parent and school
  const students = await Student.find({
    _id: { $in: parent.students },
    schoolId,
    status: { $in: ['active', 'promoted'] }
  })
    .populate('currentClass', 'name')
    .populate('currentSection', 'name')
    .populate('academicYear', 'name startDate endDate')
    .populate('feeStructure', 'name totalAmount')
    .sort('firstName');

  const children = students.map((s) => ({
    id: s._id,
    _id: s._id,
    name: `${s.firstName} ${s.lastName}`.trim(),
    firstName: s.firstName,
    lastName: s.lastName,
    admissionNo: s.admissionNo,
    rollNo: s.rollNo || '-',
    class: s.currentClass?.name || 'Class',
    classId: s.currentClass?._id,
    section: s.currentSection?.name || 'Section',
    sectionId: s.currentSection?._id,
    academicYear: s.academicYear?.name || 'Current Year',
    gender: s.gender,
    dateOfBirth: s.dateOfBirth,
    avatar: s.avatar || '',
    relationship: parent.relation ? (parent.relation.charAt(0).toUpperCase() + parent.relation.slice(1)) : 'Parent',
    status: s.status,
  }));

  return { children, parent: { _id: parent._id, name: `${parent.firstName} ${parent.lastName}`.trim() } };
};

export const getChildDashboard = async (studentId, user, schoolId) => {
  const parent = await getParentForUser(user, schoolId);

  // Strict tenant and relationship verification
  const isLinked = parent.students.some((id) => id.toString() === studentId.toString());
  if (!isLinked) {
    throw new ApiError(403, 'Access denied: Selected child is not linked to your parent account');
  }

  const student = await Student.findOne({ _id: studentId, schoolId })
    .populate('currentClass', 'name')
    .populate('currentSection', 'name')
    .populate('academicYear', 'name startDate endDate')
    .populate('feeStructure', 'name totalAmount');

  if (!student) {
    throw new ApiError(404, 'Student not found in this school');
  }

  const today = new Date();
  const todayDay = today.getDay(); // 0 to 6 (0=Sun, 1=Mon, ..., 6=Sat)

  // Fetch all child data in parallel
  const [
    attendanceRecords,
    homeworkList,
    upcomingExams,
    recentMarks,
    feeTransactions,
    timetableDoc,
    noticesList,
    eventsList,
    recognitionList,
    leaveList,
    meetingParticipants
  ] = await Promise.all([
    // 1. Attendance
    Attendance.find({ schoolId, 'students.student': student._id }).sort('-date'),

    // 2. Homework for student's class and section
    Homework.find({
      schoolId,
      schoolClass: student.currentClass?._id,
      $or: [
        { section: student.currentSection?._id },
        { section: null },
        { section: { $exists: false } }
      ]
    })
      .populate('subject', 'name code')
      .populate('teacher', 'firstName lastName')
      .sort('-dueDate')
      .limit(6),

    // 3. Upcoming exams for student's class
    Exam.find({
      schoolId,
      schoolClass: student.currentClass?._id,
      status: { $in: ['upcoming', 'ongoing'] }
    })
      .populate('subjects.subject', 'name code')
      .sort('startDate')
      .limit(5),

    // 4. Recent marks / grades
    Mark.find({ schoolId, student: student._id })
      .populate('exam', 'name type startDate')
      .populate('subject', 'name code')
      .sort('-createdAt')
      .limit(6),

    // 5. Fee transactions
    FeeTransaction.find({ schoolId, student: student._id })
      .populate('feeStructure', 'name totalAmount')
      .sort('-createdAt'),

    // 6. Timetable
    Timetable.findOne({
      schoolId,
      schoolClass: student.currentClass?._id,
      section: student.currentSection?._id,
      status: 'published'
    })
      .populate('periods.subject', 'name code')
      .populate('periods.teacher', 'firstName lastName'),

    // 7. Notices
    Notice.find({
      schoolId,
      status: 'published',
      $or: [
        { scope: 'school' },
        { scope: 'student' },
        { scope: 'class', targetClasses: student.currentClass?._id },
        { targetSections: student.currentSection?._id }
      ]
    })
      .sort('-createdAt')
      .limit(5),

    // 8. Events (excluding parent-teacher meetings)
    Event.find({
      schoolId,
      status: { $ne: 'cancelled' },
      type: { $ne: 'ptm' },
      startDate: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      $or: [
        { audience: { $in: ['all', 'parents', 'students'] } },
        { targetClasses: student.currentClass?._id }
      ]
    })
      .sort('startDate')
      .limit(5),

    // 9. Recognition Points
    RecognitionPoint.find({ schoolId, student: student._id })
      .populate('awardedBy', 'firstName lastName')
      .sort('-createdAt')
      .limit(10),

    // 10. Leave requests
    Leave.find({
      schoolId,
      $or: [
        { requester: user._id },
        { requester: student._id }
      ]
    })
      .sort('-createdAt')
      .limit(5),

    // 11. Parent Meetings (Upcoming published meetings matching child's class or parent participant)
    Promise.all([
      ParentMeetingClass.find({ schoolId, schoolClass: student.currentClass?._id }).distinct('meetingId'),
      ParentMeetingParticipant.find({ schoolId, parent: parent._id, student: student._id }).distinct('meetingId'),
    ]).then(async ([classMids, partMids]) => {
      const combinedMids = [...new Set([...classMids.map((id) => id.toString()), ...partMids.map((id) => id.toString())])];
      if (!combinedMids.length) return [];
      const meetings = await ParentMeeting.find({ _id: { $in: combinedMids }, schoolId, status: 'PUBLISHED' })
        .populate('createdBy', 'name')
        .sort('-date')
        .limit(10);
      const myParticipants = await ParentMeetingParticipant.find({
        schoolId,
        parent: parent._id,
        student: student._id,
        meetingId: { $in: meetings.map((m) => m._id) }
      });
      const rsvpMap = new Map(myParticipants.map((p) => [p.meetingId.toString(), { participantId: p._id, rsvpStatus: p.rsvpStatus }]));
      return meetings.map((m) => ({
        meetingDoc: m,
        participantInfo: rsvpMap.get(m._id.toString())
      }));
    })
  ]);

  // --- Calculate Attendance Summary ---
  let presentCount = 0;
  let absentCount = 0;
  let lateCount = 0;
  let leaveCount = 0;
  const recentAttendanceLogs = [];

  for (const record of attendanceRecords) {
    const studentStatus = record.students?.find(
      (s) => s.student?.toString() === student._id.toString()
    );
    if (studentStatus) {
      if (studentStatus.status === 'present') presentCount++;
      else if (studentStatus.status === 'absent') absentCount++;
      else if (studentStatus.status === 'late') lateCount++;
      else if (studentStatus.status === 'leave') leaveCount++;

      if (recentAttendanceLogs.length < 5) {
        recentAttendanceLogs.push({
          date: record.date,
          status: studentStatus.status,
          remarks: studentStatus.remarks || ''
        });
      }
    }
  }

  const totalAttendanceDays = presentCount + absentCount + lateCount + leaveCount;
  const attendancePercentage = totalAttendanceDays > 0
    ? Math.round(((presentCount + lateCount) / totalAttendanceDays) * 100)
    : 0;

  // --- Process Homework ---
  const formattedHomework = homeworkList.map((hw) => {
    const mySub = hw.submissions?.find((sub) => sub.student?.toString() === student._id.toString());
    const isOverdue = new Date() > new Date(hw.dueDate);
    let submissionStatus = 'pending';
    if (mySub) {
      submissionStatus = mySub.status || 'submitted';
    } else if (isOverdue) {
      submissionStatus = 'overdue';
    }

    return {
      _id: hw._id,
      title: hw.title,
      description: hw.description,
      subjectName: hw.subject?.name || 'Subject',
      teacherName: hw.teacher ? `${hw.teacher.firstName} ${hw.teacher.lastName}`.trim() : 'Teacher',
      dueDate: hw.dueDate,
      submissionStatus,
      marks: mySub?.marks,
      attachments: hw.attachments || []
    };
  });

  // --- Process Fees ---
  let totalAssignedFee = 0;
  let totalPaidFee = 0;
  let totalBalanceFee = 0;
  let nextDueDate = null;

  if (feeTransactions.length > 0) {
    for (const tx of feeTransactions) {
      totalAssignedFee += tx.amount || 0;
      totalPaidFee += tx.paidAmount || 0;
      totalBalanceFee += tx.balance || 0;
      if (tx.balance > 0 && tx.dueDate) {
        if (!nextDueDate || new Date(tx.dueDate) < new Date(nextDueDate)) {
          nextDueDate = tx.dueDate;
        }
      }
    }
  } else if (student.feeStructure) {
    totalAssignedFee = student.feeStructure.totalAmount || 0;
    totalBalanceFee = totalAssignedFee;
  }

  const feeStatus = totalBalanceFee <= 0 && totalAssignedFee > 0 ? 'PAID' : (totalPaidFee > 0 ? 'PARTIAL' : 'PENDING');

  // --- Process Timetable for Today ---
  const todayPeriods = [];
  if (timetableDoc?.periods) {
    const periodsForToday = timetableDoc.periods
      .filter((p) => p.day === todayDay)
      .sort((a, b) => a.periodNo - b.periodNo);

    for (const p of periodsForToday) {
      todayPeriods.push({
        periodNo: p.periodNo,
        subjectName: p.isLunch || p.isBreak ? (p.label || 'Break') : (p.subject?.name || 'Subject'),
        teacherName: p.teacher ? `${p.teacher.firstName} ${p.teacher.lastName}`.trim() : '',
        room: p.room || '',
        startTime: p.startTime || '',
        endTime: p.endTime || '',
        isBreak: p.isLunch || p.isBreak || p.isAssembly,
        label: p.label
      });
    }
  }

  // --- Process Recognition ---
  const totalRecognitionPoints = recognitionList.reduce((sum, r) => sum + (r.points || 0), 0);

  // --- Process Meetings ---
  const isMeetingPast = (m) => {
    if (!m || !m.date) return true;
    const now = new Date();
    const dateObj = new Date(m.date);
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const meetingDayStart = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate()).getTime();
    return meetingDayStart < todayStart;
  };

  const validMeetings = (meetingParticipants || [])
    .filter(({ meetingDoc }) => meetingDoc && meetingDoc.status === 'PUBLISHED' && !isMeetingPast(meetingDoc))
    .map(({ meetingDoc, participantInfo }) => ({
      _id: meetingDoc._id,
      participantId: participantInfo?.participantId,
      title: meetingDoc.title,
      type: meetingDoc.type,
      date: meetingDoc.date,
      startTime: meetingDoc.startTime,
      endTime: meetingDoc.endTime,
      location: meetingDoc.location,
      instructions: meetingDoc.instructions,
      status: meetingDoc.status,
      myRsvp: participantInfo?.rsvpStatus || 'PENDING'
    }));

  const schoolSetting = await Setting.findOne({ schoolId }).select('visibility');
  const parentVis = {
    attendance: schoolSetting?.visibility?.parent?.attendance !== false,
    homework: schoolSetting?.visibility?.parent?.homework !== false,
    marks: schoolSetting?.visibility?.parent?.marks !== false,
    timetable: schoolSetting?.visibility?.parent?.timetable !== false,
    fees: schoolSetting?.visibility?.parent?.fees !== false,
    leaves: schoolSetting?.visibility?.parent?.leaves !== false,
    recognition: schoolSetting?.visibility?.parent?.recognition !== false,
    documents: schoolSetting?.visibility?.parent?.documents !== false,
    teacherInfo: schoolSetting?.visibility?.parent?.teacherInfo !== false,
  };

  const sanitizedPeriods = todayPeriods.map((p) => ({
    ...p,
    teacherName: parentVis.teacherInfo ? p.teacherName : '',
  }));

  const sanitizedHomework = formattedHomework.map((h) => ({
    ...h,
    teacherName: parentVis.teacherInfo ? h.teacherName : '',
  }));

  return {
    student: {
      _id: student._id,
      id: student._id,
      name: `${student.firstName} ${student.lastName}`.trim(),
      firstName: student.firstName,
      lastName: student.lastName,
      admissionNo: student.admissionNo,
      rollNo: student.rollNo || '-',
      class: student.currentClass?.name || 'Class',
      classId: student.currentClass?._id,
      section: student.currentSection?.name || 'Section',
      sectionId: student.currentSection?._id,
      academicYear: student.academicYear?.name || '',
      gender: student.gender,
      dateOfBirth: student.dateOfBirth,
      avatar: student.avatar || '',
      relationship: parent.relation ? (parent.relation.charAt(0).toUpperCase() + parent.relation.slice(1)) : 'Parent',
      status: student.status
    },
    visibility: parentVis,
    attendance: parentVis.attendance ? {
      percentage: attendancePercentage,
      totalDays: totalAttendanceDays,
      present: presentCount,
      absent: absentCount,
      late: lateCount,
      leave: leaveCount,
      recentLogs: recentAttendanceLogs
    } : null,
    homework: parentVis.homework ? {
      items: sanitizedHomework,
      pendingCount: sanitizedHomework.filter((h) => h.submissionStatus === 'pending' || h.submissionStatus === 'overdue').length
    } : null,
    exams: parentVis.marks ? {
      upcoming: upcomingExams.map((e) => ({
        _id: e._id,
        name: e.name,
        type: e.type,
        startDate: e.startDate,
        endDate: e.endDate,
        subjectCount: e.subjects?.length || 0
      })),
      recentResults: recentMarks.map((m) => ({
        _id: m._id,
        examName: m.exam?.name || 'Exam',
        subjectName: m.subject?.name || 'Subject',
        marksObtained: m.marksObtained,
        maxMarks: m.maxMarks,
        grade: m.grade || '',
        percentage: m.percentage || (m.maxMarks > 0 ? Math.round((m.marksObtained / m.maxMarks) * 100) : 0),
        remarks: m.remarks || ''
      }))
    } : null,
    fees: parentVis.fees ? {
      totalAssigned: totalAssignedFee,
      totalPaid: totalPaidFee,
      balance: Math.max(0, totalBalanceFee),
      status: feeStatus,
      nextDueDate,
      transactions: feeTransactions.slice(0, 5).map((t) => ({
        _id: t._id,
        amount: t.amount,
        paidAmount: t.paidAmount,
        balance: t.balance,
        status: t.status,
        paymentMethod: t.paymentMethod,
        paymentDate: t.paymentDate,
        transactionId: t.transactionId
      }))
    } : null,
    timetable: parentVis.timetable ? {
      todayDay,
      periods: sanitizedPeriods,
      hasSchedule: sanitizedPeriods.length > 0
    } : null,
    notices: noticesList.map((n) => ({
      _id: n._id,
      title: n.title,
      content: n.content,
      category: n.category,
      isPinned: n.isPinned,
      createdAt: n.createdAt
    })),
    events: eventsList.map((e) => ({
      _id: e._id,
      title: e.title,
      type: e.type,
      startDate: e.startDate,
      endDate: e.endDate,
      startTime: e.startTime,
      endTime: e.endTime,
      location: e.location,
      color: e.color
    })),
    recognition: parentVis.recognition ? {
      totalPoints: totalRecognitionPoints,
      items: recognitionList.map((r) => ({
        _id: r._id,
        points: r.points,
        category: r.category,
        note: r.note,
        awardedBy: parentVis.teacherInfo ? (r.awardedBy ? `${r.awardedBy.firstName} ${r.awardedBy.lastName}`.trim() : 'Teacher') : 'School',
        createdAt: r.createdAt
      }))
    } : null,
    leaves: parentVis.leaves ? {
      approved: leaveList.filter((l) => l.status === 'approved').length,
      pending: leaveList.filter((l) => l.status === 'pending').length,
      recent: leaveList
    } : null,
    meetings: validMeetings
  };
};


