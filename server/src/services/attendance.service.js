import Attendance from '../models/Attendance.js';
import Student from '../models/Student.js';
import ApiError from '../utils/ApiError.js';
import { paginate } from '../utils/pagination.js';

export const markAttendance = async (schoolId, data, userId) => {
  const existing = await Attendance.findOne({
    schoolId, date: new Date(data.date), schoolClass: data.schoolClass, subject: data.subject || null,
  });

  if (existing) throw new ApiError(409, 'Attendance already marked for this date/class/subject');

  const summary = { present: 0, absent: 0, late: 0, leave: 0, total: data.students.length };
  for (const s of data.students) {
    summary[s.status]++;
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
  const existing = await Attendance.findOne({
    schoolId, date: new Date(data.date), schoolClass: data.schoolClass, subject: data.subject || null,
  });

  if (existing) throw new ApiError(409, 'Attendance already marked');

  const students = await Student.find({ schoolId, currentClass: data.schoolClass, currentSection: data.section, status: 'active' });

  const studentStatuses = students.map((s) => ({
    student: s._id,
    status: data.absentStudentIds?.includes(s._id.toString()) ? 'absent' : 'present',
  }));

  const summary = { present: 0, absent: 0, late: 0, leave: 0, total: studentStatuses.length };
  for (const s of studentStatuses) {
    summary[s.status]++;
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
  return paginate(Attendance, { schoolId }, { ...options, searchFields: [] });
};

export const getStudentAttendance = async (schoolId, studentId, options) => {
  return paginate(Attendance, { schoolId, 'students.student': studentId }, options);
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
