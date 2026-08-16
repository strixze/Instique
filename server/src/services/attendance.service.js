import Attendance from '../models/Attendance.js';
import Student from '../models/Student.js';
import ApiError from '../utils/ApiError.js';
import { paginate } from '../utils/pagination.js';

export const markAttendance = async (schoolId, data, userId) => {
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

export const markAllPresent = async (schoolId, data, userId) => {
  const students = await Student.find({
    schoolId,
    currentClass: data.schoolClass,
    currentSection: data.section,
    status: 'active',
  });

  const studentStatuses = students.map((s) => ({
    student: s._id,
    status: data.absentStudentIds?.includes(s._id.toString()) ? 'absent' : 'present',
  }));

  const summary = { present: 0, absent: 0, late: 0, leave: 0, total: studentStatuses.length };
  for (const s of studentStatuses) {
    summary[s.status]++;
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

export const getStudentAttendance = async (schoolId, studentId, options) => {
  return paginate(Attendance, { schoolId, 'students.student': studentId }, options);
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

  const report = { totalDays: records.length, present: 0, absent: 0, late: 0, leave: 0, studentStats: {} };
  for (const r of records) {
    report.present += r.summary?.present || 0;
    report.absent += r.summary?.absent || 0;
    report.late += r.summary?.late || 0;
    report.leave += r.summary?.leave || 0;

    if (r.students && Array.isArray(r.students)) {
      for (const s of r.students) {
        const sid = s.student.toString();
        if (!report.studentStats[sid]) {
          report.studentStats[sid] = { present: 0, absent: 0, late: 0, leave: 0 };
        }
        if (s.status) {
          report.studentStats[sid][s.status] = (report.studentStats[sid][s.status] || 0) + 1;
        }
      }
    }
  }

  return report;
};
