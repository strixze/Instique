import Attendance from '../models/Attendance.js';
import Student from '../models/Student.js';
import Leave from '../models/Leave.js';
import ApiError from '../utils/ApiError.js';
import Setting from '../models/Setting.js';
import { paginate } from '../utils/pagination.js';

export const markAttendance = async (schoolId, data, userId, userRole = null) => {
  const existing = await Attendance.findOne({
    schoolId,
    date: new Date(data.date),
    schoolClass: data.schoolClass,
    section: data.section || null,
    subject: data.subject || null,
  });

  const summary = { present: 0, absent: 0, late: 0, leave: 0, total: data.students.length };
  for (const s of data.students) {
    summary[s.status]++;
  }

  if (existing) {
    if (userRole === 'teacher') {
      const schoolSetting = await Setting.findOne({ schoolId }).select('visibility attendance');
      if (schoolSetting?.visibility?.teacherPolicy?.canEditSubmittedAttendance === false || schoolSetting?.attendance?.allowTeacherEdit === false) {
        throw new ApiError(403, 'Editing submitted attendance is not permitted for teachers by school policy');
      }
      const editWindowHours = schoolSetting?.attendance?.editWindowHours ?? 24;
      const createdAtTime = new Date(existing.createdAt || existing.updatedAt || Date.now()).getTime();
      if (Date.now() - createdAtTime > editWindowHours * 3600 * 1000) {
        throw new ApiError(403, `Attendance edit window (${editWindowHours}h) has expired`);
      }
    }

    // Update existing attendance record (upsert behaviour)
    existing.students = data.students;
    existing.summary = summary;
    existing.markedBy = userId;
    existing.source = data.source || 'manual';
    await existing.save();
    return existing;
  }

  const attendance = await Attendance.create({
    ...data,
    schoolId,
    date: new Date(data.date),
    markedBy: userId,
    summary,
  });

  return attendance;
};

export const markAllPresent = async (schoolId, data, userId, userRole = null) => {
  const students = await Student.find({
    schoolId,
    currentClass: data.schoolClass,
    currentSection: data.section,
    status: 'active',
  });

  const targetDate = new Date(data.date);
  const approvedLeaves = await Leave.find({
    schoolId,
    status: 'approved',
    student: { $in: students.map((s) => s._id) },
    startDate: { $lte: targetDate },
    endDate: { $gte: targetDate },
  }).select('student');

  const onLeaveSet = new Set(approvedLeaves.map((l) => l.student?.toString()).filter(Boolean));

  const studentStatuses = students.map((s) => {
    const sId = s._id.toString();
    let status = 'present';
    if (onLeaveSet.has(sId)) {
      status = 'leave';
    } else if (data.absentStudentIds?.includes(sId)) {
      status = 'absent';
    }
    return {
      student: s._id,
      status,
    };
  });

  const summary = { present: 0, absent: 0, late: 0, leave: 0, total: studentStatuses.length };
  for (const s of studentStatuses) {
    if (summary[s.status] !== undefined) {
      summary[s.status]++;
    }
  }

  // Upsert: update if attendance already exists for this date/class/section
  const existing = await Attendance.findOne({
    schoolId,
    date: new Date(data.date),
    schoolClass: data.schoolClass,
    section: data.section || null,
    subject: data.subject || null,
  });

  if (existing) {
    if (userRole === 'teacher') {
      const schoolSetting = await Setting.findOne({ schoolId }).select('visibility attendance');
      if (schoolSetting?.visibility?.teacherPolicy?.canEditSubmittedAttendance === false || schoolSetting?.attendance?.allowTeacherEdit === false) {
        throw new ApiError(403, 'Editing submitted attendance is not permitted for teachers by school policy');
      }
      const editWindowHours = schoolSetting?.attendance?.editWindowHours ?? 24;
      const createdAtTime = new Date(existing.createdAt || existing.updatedAt || Date.now()).getTime();
      if (Date.now() - createdAtTime > editWindowHours * 3600 * 1000) {
        throw new ApiError(403, `Attendance edit window (${editWindowHours}h) has expired`);
      }
    }

    existing.students = studentStatuses;
    existing.summary = summary;
    existing.markedBy = userId;
    existing.source = 'bulk';
    await existing.save();
    return existing;
  }

  const attendance = await Attendance.create({
    date: new Date(data.date),
    schoolClass: data.schoolClass,
    section: data.section,
    subject: data.subject,
    students: studentStatuses,
    schoolId,
    markedBy: userId,
    source: 'bulk',
    summary,
  });

  return attendance;
};

export const applyApprovedLeaveToAttendance = async (schoolId, studentId, classId, sectionId, startDate, endDate, markedBy) => {
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);

  const query = {
    schoolId,
    date: { $gte: start, $lte: end },
  };
  if (classId) query.schoolClass = classId;
  if (sectionId) query.section = sectionId;

  const attendanceRecords = await Attendance.find(query);

  for (const record of attendanceRecords) {
    let modified = false;
    const studentEntry = record.students.find((s) => s.student?.toString() === studentId.toString());
    if (studentEntry) {
      if (studentEntry.status !== 'leave') {
        studentEntry.status = 'leave';
        modified = true;
      }
    } else {
      record.students.push({ student: studentId, status: 'leave' });
      modified = true;
    }

    if (modified) {
      const summary = { present: 0, absent: 0, late: 0, leave: 0, holiday: 0, total: record.students.length };
      for (const s of record.students) {
        if (summary[s.status] !== undefined) {
          summary[s.status]++;
        }
      }
      record.summary = summary;
      if (markedBy) record.markedBy = markedBy;
      await record.save();
    }
  }
};

export const getAttendance = async (schoolId, options) => {
  return paginate(Attendance, { schoolId }, {
    ...options,
    searchFields: [],
    populate: [
      { path: 'schoolClass', select: 'name' },
      { path: 'section', select: 'name' },
    ],
  });
};

export const getStudentAttendance = async (schoolId, studentId, options = {}) => {
  const query = {
    schoolId,
    'students.student': studentId,
  };

  if (options.startDate && options.endDate) {
    query.date = { $gte: new Date(options.startDate), $lte: new Date(options.endDate) };
  } else if (options.month && options.year) {
    const start = new Date(Number(options.year), Number(options.month) - 1, 1);
    const end = new Date(Number(options.year), Number(options.month), 0, 23, 59, 59, 999);
    query.date = { $gte: start, $lte: end };
  }

  const student = await Student.findOne({ _id: studentId, schoolId })
    .populate('currentClass', 'name')
    .populate('currentSection', 'name');

  const records = await Attendance.find(query)
    .sort({ date: -1 })
    .populate('schoolClass', 'name')
    .populate('section', 'name')
    .populate('subject', 'name code')
    .populate('markedBy', 'name');

  const logs = records.map((r) => {
    const entry = r.students.find((s) => s.student?.toString() === studentId.toString());
    return {
      _id: r._id,
      date: r.date,
      status: entry ? entry.status : 'unknown',
      class: r.schoolClass?.name,
      section: r.section?.name,
      subject: r.subject?.name,
      markedBy: r.markedBy?.name,
      source: r.source || 'manual',
    };
  });

  const totalDays = logs.length;
  const presentDays = logs.filter((l) => l.status === 'present').length;
  const absentDays = logs.filter((l) => l.status === 'absent').length;
  const lateDays = logs.filter((l) => l.status === 'late').length;
  const leaveDays = logs.filter((l) => l.status === 'leave').length;
  const holidayDays = logs.filter((l) => l.status === 'holiday').length;

  const effectiveWorkingDays = totalDays - holidayDays;
  const attendanceRate = effectiveWorkingDays > 0
    ? Math.round(((presentDays + lateDays * 0.5) / effectiveWorkingDays) * 100)
    : 0;

  // Monthly breakdown
  const monthlyTrends = {};
  logs.forEach((l) => {
    const d = new Date(l.date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const monthLabel = d.toLocaleString('default', { month: 'short', year: '2-digit' });
    if (!monthlyTrends[key]) {
      monthlyTrends[key] = {
        key,
        month: monthLabel,
        total: 0,
        present: 0,
        absent: 0,
        late: 0,
        leave: 0,
      };
    }
    if (l.status !== 'holiday') {
      monthlyTrends[key].total++;
      if (l.status === 'present') monthlyTrends[key].present++;
      else if (l.status === 'absent') monthlyTrends[key].absent++;
      else if (l.status === 'late') monthlyTrends[key].late++;
      else if (l.status === 'leave') monthlyTrends[key].leave++;
    }
  });

  const monthlyBreakdown = Object.values(monthlyTrends)
    .sort((a, b) => a.key.localeCompare(b.key))
    .slice(-6)
    .map((m) => ({
      ...m,
      rate: m.total > 0 ? Math.round(((m.present + m.late * 0.5) / m.total) * 100) : 0,
    }));

  // Day of week consistency
  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const dayStats = {
    Mon: { present: 0, total: 0 },
    Tue: { present: 0, total: 0 },
    Wed: { present: 0, total: 0 },
    Thu: { present: 0, total: 0 },
    Fri: { present: 0, total: 0 },
    Sat: { present: 0, total: 0 },
  };

  logs.forEach((l) => {
    const dayName = daysOfWeek[new Date(l.date).getDay()];
    if (dayStats[dayName] && l.status !== 'holiday') {
      dayStats[dayName].total++;
      if (l.status === 'present' || l.status === 'late') dayStats[dayName].present++;
    }
  });

  const dayOfWeekBreakdown = Object.entries(dayStats).map(([day, s]) => ({
    day,
    total: s.total,
    present: s.present,
    rate: s.total > 0 ? Math.round((s.present / s.total) * 100) : 0,
  }));

  // Consecutive streak
  let currentStreak = 0;
  for (const l of logs) {
    if (l.status === 'present') {
      currentStreak++;
    } else if (l.status === 'holiday') {
      continue;
    } else {
      break;
    }
  }

  const schoolSetting = await Setting.findOne({ schoolId }).select('attendance');
  const minAttendancePercentage = schoolSetting?.attendance?.minAttendancePercentage ?? 75;

  return {
    student: {
      _id: student?._id,
      firstName: student?.firstName,
      lastName: student?.lastName,
      admissionNo: student?.admissionNo,
      rollNo: student?.rollNo,
      className: student?.currentClass?.name,
      sectionName: student?.currentSection?.name,
      avatar: student?.avatar,
    },
    analytics: {
      attendanceRate,
      minAttendancePercentage,
      isBelowThreshold: attendanceRate < minAttendancePercentage,
      totalWorkingDays: effectiveWorkingDays,
      presentDays,
      absentDays,
      lateDays,
      leaveDays,
      holidayDays,
      currentStreak,
      monthlyBreakdown,
      dayOfWeekBreakdown,
      statusBreakdown: {
        present: presentDays,
        absent: absentDays,
        late: lateDays,
        leave: leaveDays,
        holiday: holidayDays,
      },
    },
    logs,
  };
};


export const getStudentsByClassSection = async (schoolId, classId, sectionId) => {
  return Student.find({
    schoolId,
    currentClass: classId,
    currentSection: sectionId,
    status: 'active',
  })
    .select('firstName lastName admissionNo rollNo')
    .sort('firstName');
};

export const getAttendanceForDate = async (schoolId, classId, sectionId, date) => {
  return Attendance.findOne({
    schoolId,
    schoolClass: classId,
    section: sectionId,
    date: new Date(date),
  });
};

export const getAttendanceReport = async (schoolId, classId, startDate, endDate) => {
  const records = await Attendance.find({
    schoolId,
    schoolClass: classId,
    date: { $gte: new Date(startDate), $lte: new Date(endDate) },
  });

  const report = { totalDays: records.length, present: 0, absent: 0, late: 0, leave: 0 };
  for (const r of records) {
    report.present += r.summary?.present || 0;
    report.absent += r.summary?.absent || 0;
    report.late += r.summary?.late || 0;
    report.leave += r.summary?.leave || 0;
  }

  return report;
};
