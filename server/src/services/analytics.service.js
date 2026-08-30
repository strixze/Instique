import mongoose from 'mongoose';
import Student from '../models/Student.js';
import Teacher from '../models/Teacher.js';
import Attendance from '../models/Attendance.js';
import FeeTransaction from '../models/FeeTransaction.js';
import FeeStructure from '../models/FeeStructure.js';
import Admission from '../models/Admission.js';
import Leave from '../models/Leave.js';
import Homework from '../models/Homework.js';
import Exam from '../models/Exam.js';
import Mark from '../models/Mark.js';
import Event from '../models/Event.js';
import Notice from '../models/Notice.js';
import Complaint from '../models/Complaint.js';
import ParentMeeting from '../models/ParentMeeting.js';
import AcademicYear from '../models/AcademicYear.js';
import SchoolClass from '../models/SchoolClass.js';
import Section from '../models/Section.js';
import Timetable from '../models/Timetable.js';

// ── Date Range Parser & Period Window Calculator ──

export function parseDateRange(period = 'this_month', customStart, customEnd) {
  const now = new Date();
  let startDate = new Date();
  let endDate = new Date();
  let prevStartDate = new Date();
  let prevEndDate = new Date();

  // Normalize current date
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  switch (period.toLowerCase()) {
    case 'today': {
      startDate = todayStart;
      endDate = todayEnd;
      prevStartDate = new Date(todayStart.getTime() - 24 * 60 * 60 * 1000);
      prevEndDate = new Date(todayEnd.getTime() - 24 * 60 * 60 * 1000);
      break;
    }
    case 'this_week':
    case 'this week': {
      const dayOfWeek = now.getDay();
      const diffToMon = (dayOfWeek + 6) % 7;
      startDate = new Date(todayStart);
      startDate.setDate(todayStart.getDate() - diffToMon);
      endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 6);
      endDate.setHours(23, 59, 59, 999);

      prevStartDate = new Date(startDate);
      prevStartDate.setDate(prevStartDate.getDate() - 7);
      prevEndDate = new Date(startDate);
      prevEndDate.setMilliseconds(-1);
      break;
    }
    case 'this_month':
    case 'this month': {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

      prevStartDate = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0);
      prevEndDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
      break;
    }
    case 'this_quarter':
    case 'this quarter': {
      const quarter = Math.floor(now.getMonth() / 3);
      startDate = new Date(now.getFullYear(), quarter * 3, 1, 0, 0, 0, 0);
      endDate = new Date(now.getFullYear(), (quarter + 1) * 3, 0, 23, 59, 59, 999);

      const prevQuarter = quarter === 0 ? 3 : quarter - 1;
      const prevQuarterYear = quarter === 0 ? now.getFullYear() - 1 : now.getFullYear();
      prevStartDate = new Date(prevQuarterYear, prevQuarter * 3, 1, 0, 0, 0, 0);
      prevEndDate = new Date(prevQuarterYear, (prevQuarter + 1) * 3, 0, 23, 59, 59, 999);
      break;
    }
    case 'this_session':
    case 'this academic session':
    case 'this_year': {
      // 1 year span
      startDate = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
      endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
      prevStartDate = new Date(now.getFullYear() - 1, 0, 1, 0, 0, 0, 0);
      prevEndDate = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59, 999);
      break;
    }
    case 'custom': {
      if (customStart && customEnd) {
        startDate = new Date(customStart);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(customEnd);
        endDate.setHours(23, 59, 59, 999);
        const duration = endDate.getTime() - startDate.getTime();
        prevEndDate = new Date(startDate.getTime() - 1);
        prevStartDate = new Date(prevEndDate.getTime() - duration);
      } else {
        startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        prevStartDate = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0);
        prevEndDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
      }
      break;
    }
    default: {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      prevStartDate = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0);
      prevEndDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
    }
  }

  return { startDate, endDate, prevStartDate, prevEndDate };
}

// ── 1. Executive Overview KPI Analytics ──

export const getExecutiveOverview = async (schoolId, query = {}) => {
  const { period = 'this_month', startDate: customStart, endDate: customEnd, academicYear: yearParam, schoolClass, section } = query;
  const { startDate, endDate, prevStartDate, prevEndDate } = parseDateRange(period, customStart, customEnd);

  // Active academic session
  const activeYear = yearParam
    ? await AcademicYear.findOne({ schoolId, _id: yearParam })
    : (await AcademicYear.findOne({ schoolId, isCurrent: true }) || await AcademicYear.findOne({ schoolId }).sort({ createdAt: -1 }));
  const academicYearId = activeYear?._id;

  const classFilter = schoolClass ? { currentClass: schoolClass } : {};
  const sectionFilter = section ? { currentSection: section } : {};

  // Queries for current and previous period
  const [
    currentStudentCount,
    prevStudentCount,
    currentTeacherCount,
    prevTeacherCount,
    currentAttendanceDocs,
    prevAttendanceDocs,
    currentFeeCollectedAgg,
    prevFeeCollectedAgg,
    currentFeePendingAgg,
    prevFeePendingAgg,
    currentAdmissionsCount,
    prevAdmissionsCount,
  ] = await Promise.all([
    Student.countDocuments({ schoolId, status: 'active', ...classFilter, ...sectionFilter }),
    Student.countDocuments({ schoolId, status: 'active', createdAt: { $lte: prevEndDate }, ...classFilter, ...sectionFilter }),
    Teacher.countDocuments({ schoolId, status: 'active' }),
    Teacher.countDocuments({ schoolId, status: 'active', createdAt: { $lte: prevEndDate } }),
    // Current period attendance
    Attendance.find({
      schoolId,
      date: { $gte: startDate, $lte: endDate },
      ...(schoolClass ? { schoolClass } : {}),
      ...(section ? { section } : {}),
    }),
    // Previous period attendance
    Attendance.find({
      schoolId,
      date: { $gte: prevStartDate, $lte: prevEndDate },
      ...(schoolClass ? { schoolClass } : {}),
      ...(section ? { section } : {}),
    }),
    // Fees collected current period
    FeeTransaction.aggregate([
      {
        $match: {
          schoolId,
          ...(academicYearId ? { academicYear: academicYearId } : {}),
          status: { $in: ['paid', 'partial'] },
          updatedAt: { $gte: startDate, $lte: endDate },
        },
      },
      { $group: { _id: null, total: { $sum: '$paidAmount' } } },
    ]),
    // Fees collected previous period
    FeeTransaction.aggregate([
      {
        $match: {
          schoolId,
          ...(academicYearId ? { academicYear: academicYearId } : {}),
          status: { $in: ['paid', 'partial'] },
          updatedAt: { $gte: prevStartDate, $lte: prevEndDate },
        },
      },
      { $group: { _id: null, total: { $sum: '$paidAmount' } } },
    ]),
    // Outstanding fees current
    FeeTransaction.aggregate([
      {
        $match: {
          schoolId,
          ...(academicYearId ? { academicYear: academicYearId } : {}),
          status: { $in: ['pending', 'partial', 'overdue'] },
        },
      },
      { $group: { _id: null, total: { $sum: '$balance' } } },
    ]),
    // Outstanding fees previous snapshot
    FeeTransaction.aggregate([
      {
        $match: {
          schoolId,
          ...(academicYearId ? { academicYear: academicYearId } : {}),
          status: { $in: ['pending', 'partial', 'overdue'] },
          createdAt: { $lte: prevEndDate },
        },
      },
      { $group: { _id: null, total: { $sum: '$balance' } } },
    ]),
    // Active admissions in current period
    Admission.countDocuments({
      schoolId,
      createdAt: { $gte: startDate, $lte: endDate },
      ...(academicYearId ? { academicYear: academicYearId } : {}),
      ...(schoolClass ? { appliedClass: schoolClass } : {}),
    }),
    // Active admissions in previous period
    Admission.countDocuments({
      schoolId,
      createdAt: { $gte: prevStartDate, $lte: prevEndDate },
      ...(academicYearId ? { academicYear: academicYearId } : {}),
      ...(schoolClass ? { appliedClass: schoolClass } : {}),
    }),
  ]);

  // Attendance rate calculations
  let currPresent = 0, currTotal = 0;
  for (const doc of currentAttendanceDocs) {
    if (doc.summary) {
      currPresent += (doc.summary.present || 0) + (doc.summary.late || 0);
      currTotal += doc.summary.total || 0;
    }
  }
  const currentAttendanceRate = currTotal > 0 ? Number(((currPresent / currTotal) * 100).toFixed(1)) : null;

  let prevPresent = 0, prevTotal = 0;
  for (const doc of prevAttendanceDocs) {
    if (doc.summary) {
      prevPresent += (doc.summary.present || 0) + (doc.summary.late || 0);
      prevTotal += doc.summary.total || 0;
    }
  }
  const prevAttendanceRate = prevTotal > 0 ? Number(((prevPresent / prevTotal) * 100).toFixed(1)) : null;

  const attendanceChange = (currentAttendanceRate !== null && prevAttendanceRate !== null)
    ? Number((currentAttendanceRate - prevAttendanceRate).toFixed(1))
    : null;

  const currentFeesCollected = currentFeeCollectedAgg[0]?.total || 0;
  const prevFeesCollected = prevFeeCollectedAgg[0]?.total || 0;
  const feesChange = prevFeesCollected > 0
    ? Number((((currentFeesCollected - prevFeesCollected) / prevFeesCollected) * 100).toFixed(1))
    : null;

  const pendingFees = currentFeePendingAgg[0]?.total || 0;
  const prevPendingFees = prevFeePendingAgg[0]?.total || 0;
  const pendingFeesChange = prevPendingFees > 0
    ? Number((((pendingFees - prevPendingFees) / prevPendingFees) * 100).toFixed(1))
    : null;

  const studentGrowth = prevStudentCount > 0
    ? Number((((currentStudentCount - prevStudentCount) / prevStudentCount) * 100).toFixed(1))
    : null;

  const teacherGrowth = prevTeacherCount > 0
    ? Number((((currentTeacherCount - prevTeacherCount) / prevTeacherCount) * 100).toFixed(1))
    : null;

  const admissionsChange = prevAdmissionsCount > 0
    ? Number((((currentAdmissionsCount - prevAdmissionsCount) / prevAdmissionsCount) * 100).toFixed(1))
    : null;

  return {
    period,
    dateRange: { startDate, endDate },
    kpis: {
      totalStudents: {
        value: currentStudentCount,
        change: studentGrowth,
        isPositive: (studentGrowth || 0) >= 0,
        label: 'vs previous period',
      },
      totalTeachers: {
        value: currentTeacherCount,
        change: teacherGrowth,
        isPositive: (teacherGrowth || 0) >= 0,
        label: 'vs previous period',
      },
      attendanceRate: {
        value: currentAttendanceRate !== null ? `${currentAttendanceRate}%` : '—',
        raw: currentAttendanceRate,
        change: attendanceChange !== null ? `${attendanceChange >= 0 ? '+' : ''}${attendanceChange}%` : null,
        isPositive: (attendanceChange || 0) >= 0,
        label: 'vs previous period',
      },
      feesCollected: {
        value: currentFeesCollected,
        change: feesChange !== null ? `${feesChange >= 0 ? '+' : ''}${feesChange}%` : null,
        isPositive: (feesChange || 0) >= 0,
        label: 'vs previous period',
      },
      pendingFees: {
        value: pendingFees,
        change: pendingFeesChange !== null ? `${pendingFeesChange >= 0 ? '+' : ''}${pendingFeesChange}%` : null,
        isPositive: (pendingFeesChange || 0) <= 0, // Lower pending is positive
        label: 'vs previous period',
      },
      activeAdmissions: {
        value: currentAdmissionsCount,
        change: admissionsChange !== null ? `${admissionsChange >= 0 ? '+' : ''}${admissionsChange}%` : null,
        isPositive: (admissionsChange || 0) >= 0,
        label: 'vs previous period',
      },
    },
  };
};

// ── 2. Student Analytics ──

export const getStudentAnalytics = async (schoolId, query = {}) => {
  const { period = 'this_session', startDate: customStart, endDate: customEnd, schoolClass, section } = query;
  const { startDate, endDate } = parseDateRange(period, customStart, customEnd);

  const baseMatch = {
    schoolId,
    ...(schoolClass ? { currentClass: schoolClass } : {}),
    ...(section ? { currentSection: section } : {}),
  };

  const [
    totalStudents,
    activeStudents,
    inactiveStudents,
    genderDistributionAgg,
    classDistributionAgg,
    enrollmentTimelineAgg,
    newAdmissionsCount,
  ] = await Promise.all([
    Student.countDocuments(baseMatch),
    Student.countDocuments({ ...baseMatch, status: 'active' }),
    Student.countDocuments({ ...baseMatch, status: { $in: ['inactive', 'suspended', 'graduated', 'withdrawn'] } }),
    // Gender Distribution
    Student.aggregate([
      { $match: { ...baseMatch, status: 'active' } },
      {
        $group: {
          _id: { $toLower: { $ifNull: ['$gender', 'unspecified'] } },
          count: { $sum: 1 },
        },
      },
    ]),
    // Students by Class
    Student.aggregate([
      { $match: { ...baseMatch, status: 'active' } },
      {
        $group: {
          _id: '$currentClass',
          count: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: 'schoolclasses',
          localField: '_id',
          foreignField: '_id',
          as: 'classDoc',
        },
      },
      { $unwind: { path: '$classDoc', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          className: { $ifNull: ['$classDoc.name', 'Unassigned'] },
          classOrder: { $ifNull: ['$classDoc.order', 99] },
          count: 1,
        },
      },
      { $sort: { classOrder: 1, className: 1 } },
    ]),
    // Enrollment Trend (timeline grouped by month or date)
    Student.aggregate([
      {
        $match: {
          schoolId,
          createdAt: { $gte: startDate, $lte: endDate },
          ...(schoolClass ? { currentClass: schoolClass } : {}),
        },
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$createdAt',
            },
          },
          enrolled: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    // New admissions in period
    Student.countDocuments({
      schoolId,
      status: 'active',
      createdAt: { $gte: startDate, $lte: endDate },
      ...(schoolClass ? { currentClass: schoolClass } : {}),
    }),
  ]);

  const genderMap = { male: 0, female: 0, other: 0, unspecified: 0 };
  genderDistributionAgg.forEach((g) => {
    const key = g._id in genderMap ? g._id : 'other';
    genderMap[key] = (genderMap[key] || 0) + g.count;
  });

  const genderChartData = [
    { name: 'Male', value: genderMap.male, color: '#6C5CE7' },
    { name: 'Female', value: genderMap.female, color: '#A78BFA' },
    ...(genderMap.other > 0 ? [{ name: 'Other', value: genderMap.other, color: '#C4B5FD' }] : []),
    ...(genderMap.unspecified > 0 ? [{ name: 'Unspecified', value: genderMap.unspecified, color: '#E2E8F0' }] : []),
  ];

  const classChartData = classDistributionAgg.map((c) => ({
    class: c.className,
    count: c.count,
    percentage: activeStudents > 0 ? Number(((c.count / activeStudents) * 100).toFixed(1)) : 0,
  }));

  return {
    summary: {
      total: totalStudents,
      active: activeStudents,
      inactive: inactiveStudents,
      newAdmissions: newAdmissionsCount,
    },
    genderDistribution: genderChartData,
    studentsByClass: classChartData,
    enrollmentTrend: enrollmentTimelineAgg.map((item) => ({
      date: item._id,
      enrolled: item.enrolled,
    })),
  };
};

// ── 3. Attendance Analytics ──

export const getAttendanceAnalytics = async (schoolId, query = {}) => {
  const { period = 'this_month', startDate: customStart, endDate: customEnd, schoolClass, section } = query;
  const { startDate, endDate, prevStartDate, prevEndDate } = parseDateRange(period, customStart, customEnd);

  const filter = {
    schoolId,
    date: { $gte: startDate, $lte: endDate },
    ...(schoolClass ? { schoolClass } : {}),
    ...(section ? { section } : {}),
  };

  const [attendanceDocs, prevAttendanceDocs, lowAttendanceAgg] = await Promise.all([
    Attendance.find(filter).populate('schoolClass', 'name').sort({ date: 1 }),
    Attendance.find({
      schoolId,
      date: { $gte: prevStartDate, $lte: prevEndDate },
      ...(schoolClass ? { schoolClass } : {}),
      ...(section ? { section } : {}),
    }),
    // Aggregate students below 75% attendance threshold
    Attendance.aggregate([
      {
        $match: {
          schoolId,
          date: { $gte: startDate, $lte: endDate },
          ...(schoolClass ? { schoolClass: new mongoose.Types.ObjectId(schoolClass) } : {}),
        },
      },
      { $unwind: '$students' },
      {
        $group: {
          _id: '$students.student',
          totalDays: { $sum: 1 },
          presentDays: {
            $sum: {
              $cond: [{ $in: ['$students.status', ['present', 'late']] }, 1, 0],
            },
          },
          absentDays: {
            $sum: {
              $cond: [{ $eq: ['$students.status', 'absent'] }, 1, 0],
            },
          },
        },
      },
      {
        $project: {
          totalDays: 1,
          presentDays: 1,
          absentDays: 1,
          rate: { $multiply: [{ $divide: ['$presentDays', '$totalDays'] }, 100] },
        },
      },
      { $match: { rate: { $lt: 75 } } },
      { $sort: { rate: 1 } },
      { $limit: 15 },
      {
        $lookup: {
          from: 'students',
          localField: '_id',
          foreignField: '_id',
          as: 'studentDoc',
        },
      },
      { $unwind: '$studentDoc' },
      {
        $lookup: {
          from: 'schoolclasses',
          localField: 'studentDoc.currentClass',
          foreignField: '_id',
          as: 'classDoc',
        },
      },
      { $unwind: { path: '$classDoc', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          studentId: '$_id',
          name: { $concat: ['$studentDoc.firstName', ' ', '$studentDoc.lastName'] },
          admissionNo: '$studentDoc.admissionNo',
          className: { $ifNull: ['$classDoc.name', '—'] },
          rate: { $round: ['$rate', 1] },
          totalDays: 1,
          absentDays: 1,
        },
      },
    ]),
  ]);

  let totalPresent = 0, totalAbsent = 0, totalLate = 0, totalExcused = 0, grandTotal = 0;
  const trendMap = {};
  const classMap = {};

  attendanceDocs.forEach((doc) => {
    const dayStr = doc.date ? new Date(doc.date).toISOString().split('T')[0] : 'Unknown';
    const summ = doc.summary || {};
    const p = summ.present || 0;
    const a = summ.absent || 0;
    const l = summ.late || 0;
    const e = summ.excused || 0;
    const t = summ.total || (p + a + l + e);

    totalPresent += p;
    totalAbsent += a;
    totalLate += l;
    totalExcused += e;
    grandTotal += t;

    // Trend grouping
    if (!trendMap[dayStr]) {
      trendMap[dayStr] = { date: dayStr, present: 0, absent: 0, total: 0 };
    }
    trendMap[dayStr].present += p + l;
    trendMap[dayStr].absent += a;
    trendMap[dayStr].total += t;

    // Class-wise grouping
    const cName = doc.schoolClass?.name || 'Class';
    if (!classMap[cName]) {
      classMap[cName] = { className: cName, present: 0, total: 0 };
    }
    classMap[cName].present += p + l;
    classMap[cName].total += t;
  });

  const overallRate = grandTotal > 0 ? Number((((totalPresent + totalLate) / grandTotal) * 100).toFixed(1)) : null;

  const trendData = Object.values(trendMap).map((d) => ({
    date: d.date,
    percentage: d.total > 0 ? Number(((d.present / d.total) * 100).toFixed(1)) : 0,
    present: d.present,
    absent: d.absent,
  }));

  const classAttendanceData = Object.values(classMap).map((c) => ({
    class: c.className,
    percentage: c.total > 0 ? Number(((c.present / c.total) * 100).toFixed(1)) : 0,
    total: c.total,
  }));

  return {
    summary: {
      overallRate: overallRate !== null ? `${overallRate}%` : '—',
      rawRate: overallRate,
      presentCount: totalPresent,
      absentCount: totalAbsent,
      lateCount: totalLate,
      excusedCount: totalExcused,
      totalCount: grandTotal,
    },
    trend: trendData,
    classAttendance: classAttendanceData,
    studentsNeedingAttention: lowAttendanceAgg,
  };
};

// ── 4. Academic Performance Analytics ──

export const getAcademicAnalytics = async (schoolId, query = {}) => {
  const { academicYear: yearParam } = query;

  const activeYear = yearParam
    ? await AcademicYear.findOne({ schoolId, _id: yearParam })
    : (await AcademicYear.findOne({ schoolId, isCurrent: true }) || await AcademicYear.findOne({ schoolId }).sort({ createdAt: -1 }));
  const academicYearId = activeYear?._id;

  // Mark schema fields: schoolId, exam, subject, student, marksObtained, maxMarks, grade, percentage
  const markMatchFilter = {
    schoolId,
    ...(academicYearId ? { academicYear: academicYearId } : {}),
  };

  const [
    examsCount,
    marksCount,
    overallPerformanceAgg,
    performanceBySubjectAgg,
    gradeDistributionAgg,
    examTrendAgg,
  ] = await Promise.all([
    Exam.countDocuments({ schoolId, ...(academicYearId ? { academicYear: academicYearId } : {}) }),
    Mark.countDocuments(markMatchFilter),
    // Overall average marks and pass percentage
    Mark.aggregate([
      { $match: markMatchFilter },
      {
        $group: {
          _id: null,
          avgPercentage: { $avg: '$percentage' },
          totalRecords: { $sum: 1 },
          passCount: {
            $sum: { $cond: [{ $gte: ['$percentage', 33] }, 1, 0] },
          },
        },
      },
    ]),
    // Performance by Subject — Mark has a flat `subject` field
    Mark.aggregate([
      { $match: markMatchFilter },
      {
        $group: {
          _id: '$subject',
          avgMarks: { $avg: '$marksObtained' },
          avgPercentage: { $avg: '$percentage' },
          count: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: 'subjects',
          localField: '_id',
          foreignField: '_id',
          as: 'subjectDoc',
        },
      },
      { $unwind: { path: '$subjectDoc', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          subjectName: { $ifNull: ['$subjectDoc.name', 'Subject'] },
          avgMarks: { $round: ['$avgPercentage', 1] },
          count: 1,
        },
      },
      { $sort: { avgMarks: -1 } },
      { $limit: 10 },
    ]),
    // Grade Distribution
    Mark.aggregate([
      { $match: markMatchFilter },
      {
        $group: {
          _id: { $ifNull: ['$grade', 'Ungraded'] },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    // Exam Trend — look up marks per exam
    Exam.aggregate([
      {
        $match: {
          schoolId,
          ...(academicYearId ? { academicYear: academicYearId } : {}),
          status: { $in: ['completed', 'published'] },
        },
      },
      {
        $lookup: {
          from: 'marks',
          let: { examId: '$_id' },
          pipeline: [
            { $match: { $expr: { $eq: ['$exam', '$$examId'] }, schoolId } },
          ],
          as: 'marksDocs',
        },
      },
      {
        $project: {
          examName: '$name',
          startDate: '$startDate',
          avgPercentage: { $avg: '$marksDocs.percentage' },
        },
      },
      { $sort: { startDate: 1 } },
      { $limit: 12 },
    ]),
  ]);

  const overall = overallPerformanceAgg[0] || {};
  const avgMarks = (overall.avgPercentage !== undefined && overall.avgPercentage !== null)
    ? Number(overall.avgPercentage.toFixed(1))
    : null;
  const passPercentage = (overall.totalRecords > 0)
    ? Number(((overall.passCount / overall.totalRecords) * 100).toFixed(1))
    : null;

  return {
    summary: {
      totalExams: examsCount,
      evaluatedRecords: marksCount,
      averageScore: avgMarks !== null ? `${avgMarks}%` : '—',
      passPercentage: passPercentage !== null ? `${passPercentage}%` : '—',
    },
    performanceByClass: [],   // Mark schema has no class field; skip class breakdown
    performanceBySubject: performanceBySubjectAgg,
    gradeDistribution: gradeDistributionAgg.map((g) => ({
      grade: g._id,
      count: g.count,
    })),
    examTrend: examTrendAgg.map((e) => ({
      exam: e.examName,
      average: e.avgPercentage ? Number(e.avgPercentage.toFixed(1)) : 0,
    })),
  };
};

// ── 5. Fee Collection Analytics ──

export const getFeeAnalytics = async (schoolId, query = {}) => {
  const { academicYear: yearParam, period = 'this_session', startDate: customStart, endDate: customEnd, schoolClass } = query;
  const { startDate, endDate } = parseDateRange(period, customStart, customEnd);

  const activeYear = yearParam
    ? await AcademicYear.findOne({ schoolId, _id: yearParam })
    : (await AcademicYear.findOne({ schoolId, isCurrent: true }) || await AcademicYear.findOne({ schoolId }).sort({ createdAt: -1 }));
  const academicYearId = activeYear?._id;

  const matchFilter = {
    schoolId,
    ...(academicYearId ? { academicYear: academicYearId } : {}),
  };

  const [
    totalAssignedAgg,
    totalCollectedAgg,
    totalPendingAgg,
    totalOverdueAgg,
    collectionTimelineAgg,
    classFeeAgg,
  ] = await Promise.all([
    // Expected fee total from structures assigned
    FeeStructure.aggregate([
      { $match: matchFilter },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } },
    ]),
    // Actually collected transactions in period
    FeeTransaction.aggregate([
      {
        $match: {
          ...matchFilter,
          status: { $in: ['paid', 'partial'] },
          updatedAt: { $gte: startDate, $lte: endDate },
        },
      },
      { $group: { _id: null, total: { $sum: '$paidAmount' } } },
    ]),
    // Currently pending balance
    FeeTransaction.aggregate([
      {
        $match: {
          ...matchFilter,
          status: { $in: ['pending', 'partial'] },
        },
      },
      { $group: { _id: null, total: { $sum: '$balance' } } },
    ]),
    // Currently overdue balance
    FeeTransaction.aggregate([
      {
        $match: {
          ...matchFilter,
          status: 'overdue',
        },
      },
      { $group: { _id: null, total: { $sum: '$balance' } } },
    ]),
    // Collection Timeline (timeline of payments)
    FeeTransaction.aggregate([
      {
        $match: {
          ...matchFilter,
          status: { $in: ['paid', 'partial'] },
          updatedAt: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$updatedAt' },
          },
          amount: { $sum: '$paidAmount' },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    // Collection by Class
    FeeTransaction.aggregate([
      { $match: matchFilter },
      {
        $lookup: {
          from: 'students',
          localField: 'student',
          foreignField: '_id',
          as: 'studentDoc',
        },
      },
      { $unwind: '$studentDoc' },
      {
        $group: {
          _id: '$studentDoc.currentClass',
          collected: { $sum: '$paidAmount' },
          pending: { $sum: '$balance' },
          total: { $sum: '$totalAmount' },
        },
      },
      {
        $lookup: {
          from: 'schoolclasses',
          localField: '_id',
          foreignField: '_id',
          as: 'classDoc',
        },
      },
      { $unwind: { path: '$classDoc', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          className: { $ifNull: ['$classDoc.name', 'Class'] },
          collected: 1,
          pending: 1,
          total: 1,
          rate: {
            $cond: [
              { $gt: ['$total', 0] },
              { $round: [{ $multiply: [{ $divide: ['$collected', '$total'] }, 100] }, 1] },
              0,
            ],
          },
        },
      },
      { $sort: { rate: -1 } },
    ]),
  ]);

  const collected = totalCollectedAgg[0]?.total || 0;
  const pending = totalPendingAgg[0]?.total || 0;
  const overdue = totalOverdueAgg[0]?.total || 0;
  const totalTarget = totalAssignedAgg[0]?.total || (collected + pending);
  const collectionRate = totalTarget > 0 ? Number(((collected / totalTarget) * 100).toFixed(1)) : 0;

  const donutData = [
    { name: 'Collected', value: collected, color: '#6C5CE7' },
    { name: 'Pending', value: pending, color: '#F59E0B' },
    ...(overdue > 0 ? [{ name: 'Overdue', value: overdue, color: '#EF4444' }] : []),
  ];

  return {
    summary: {
      totalTarget,
      collected,
      pending,
      overdue,
      collectionRate: `${collectionRate}%`,
      rawRate: collectionRate,
    },
    donut: donutData,
    timeline: collectionTimelineAgg.map((t) => ({
      date: t._id,
      amount: t.amount,
    })),
    classCollection: classFeeAgg,
  };
};

// ── 6. Admissions Funnel Analytics ──

export const getAdmissionsAnalytics = async (schoolId, query = {}) => {
  const { academicYear: yearParam, period = 'this_session', startDate: customStart, endDate: customEnd } = query;
  const { startDate, endDate } = parseDateRange(period, customStart, customEnd);

  const activeYear = yearParam
    ? await AcademicYear.findOne({ schoolId, _id: yearParam })
    : (await AcademicYear.findOne({ schoolId, isCurrent: true }) || await AcademicYear.findOne({ schoolId }).sort({ createdAt: -1 }));
  const academicYearId = activeYear?._id;

  const matchFilter = {
    schoolId,
    ...(academicYearId ? { academicYear: academicYearId } : {}),
  };

  const [
    totalApplications,
    underReviewCount,
    approvedCount,
    rejectedCount,
    enrolledCount,
    timelineAgg,
  ] = await Promise.all([
    Admission.countDocuments({ ...matchFilter, createdAt: { $gte: startDate, $lte: endDate } }),
    Admission.countDocuments({ ...matchFilter, workflowStatus: { $in: ['submitted', 'document_upload', 'verification', 'under_review', 'payment_pending'] } }),
    Admission.countDocuments({ ...matchFilter, workflowStatus: 'approved' }),
    Admission.countDocuments({ ...matchFilter, workflowStatus: 'rejected' }),
    Admission.countDocuments({ ...matchFilter, workflowStatus: 'enrolled' }),
    // Application trend
    Admission.aggregate([
      {
        $match: {
          ...matchFilter,
          createdAt: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
  ]);

  const conversionRate = totalApplications > 0
    ? Number(((enrolledCount / totalApplications) * 100).toFixed(1))
    : 0;

  const funnel = [
    { stage: 'Applications', count: totalApplications, percentage: 100, color: '#6C5CE7' },
    { stage: 'Under Review', count: underReviewCount, percentage: totalApplications > 0 ? Number(((underReviewCount / totalApplications) * 100).toFixed(1)) : 0, color: '#A78BFA' },
    { stage: 'Approved', count: approvedCount, percentage: totalApplications > 0 ? Number(((approvedCount / totalApplications) * 100).toFixed(1)) : 0, color: '#3B82F6' },
    { stage: 'Enrolled', count: enrolledCount, percentage: conversionRate, color: '#10B981' },
  ];

  return {
    summary: {
      totalApplications,
      underReviewCount,
      approvedCount,
      rejectedCount,
      enrolledCount,
      conversionRate: `${conversionRate}%`,
    },
    funnel,
    timeline: timelineAgg.map((item) => ({
      date: item._id,
      applications: item.count,
    })),
  };
};

// ── 7. Teacher & Staff Analytics ──

export const getTeacherAnalytics = async (schoolId, query = {}) => {
  const [
    totalTeachers,
    activeTeachers,
    inactiveTeachers,
    departmentAgg,
    pendingLeavesCount,
    onLeaveTodayCount,
  ] = await Promise.all([
    Teacher.countDocuments({ schoolId }),
    Teacher.countDocuments({ schoolId, status: 'active' }),
    Teacher.countDocuments({ schoolId, status: { $in: ['inactive', 'suspended'] } }),
    // Department breakdown
    Teacher.aggregate([
      { $match: { schoolId, status: 'active' } },
      {
        $group: {
          _id: { $ifNull: ['$department', 'General'] },
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ]),
    Leave.countDocuments({ schoolId, requesterModel: 'Teacher', status: 'pending' }),
    Leave.countDocuments({
      schoolId,
      requesterModel: 'Teacher',
      status: 'approved',
      startDate: { $lte: new Date() },
      endDate: { $gte: new Date() },
    }),
  ]);

  return {
    summary: {
      total: totalTeachers,
      active: activeTeachers,
      inactive: inactiveTeachers,
      onLeaveToday: onLeaveTodayCount,
      pendingLeaves: pendingLeavesCount,
    },
    departmentDistribution: departmentAgg.map((d) => ({
      department: d._id,
      count: d.count,
    })),
  };
};

// ── 8. Homework & Activity Analytics ──

export const getHomeworkAnalytics = async (schoolId, query = {}) => {
  const { period = 'this_month', startDate: customStart, endDate: customEnd, schoolClass } = query;
  const { startDate, endDate } = parseDateRange(period, customStart, customEnd);

  const matchFilter = {
    schoolId,
    createdAt: { $gte: startDate, $lte: endDate },
    ...(schoolClass ? { schoolClass: new mongoose.Types.ObjectId(schoolClass) } : {}),
  };

  const [
    totalHomework,
    publishedCount,
    draftCount,
    homeworkByClassAgg,
    homeworkTimelineAgg,
  ] = await Promise.all([
    Homework.countDocuments(matchFilter),
    Homework.countDocuments({ ...matchFilter, status: 'published' }),
    Homework.countDocuments({ ...matchFilter, status: 'draft' }),
    // Homework by Class
    Homework.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: '$schoolClass',
          count: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: 'schoolclasses',
          localField: '_id',
          foreignField: '_id',
          as: 'classDoc',
        },
      },
      { $unwind: { path: '$classDoc', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          className: { $ifNull: ['$classDoc.name', 'Class'] },
          count: 1,
        },
      },
      { $sort: { count: -1 } },
    ]),
    // Homework timeline
    Homework.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
  ]);

  return {
    summary: {
      total: totalHomework,
      published: publishedCount,
      drafts: draftCount,
    },
    homeworkByClass: homeworkByClassAgg,
    timeline: homeworkTimelineAgg.map((h) => ({
      date: h._id,
      count: h.count,
    })),
  };
};

// ── 9. Operational & Communication Analytics ──

export const getOperationsAnalytics = async (schoolId) => {
  const [
    eventsTotal,
    upcomingEvents,
    noticesTotal,
    complaintsTotal,
    resolvedComplaints,
    parentMeetingsTotal,
  ] = await Promise.all([
    Event.countDocuments({ schoolId }),
    Event.countDocuments({ schoolId, startDate: { $gte: new Date() } }),
    Notice.countDocuments({ schoolId }),
    Complaint.countDocuments({ schoolId }),
    Complaint.countDocuments({ schoolId, status: 'resolved' }),
    ParentMeeting.countDocuments({ schoolId }),
  ]);

  const resolutionRate = complaintsTotal > 0
    ? Number(((resolvedComplaints / complaintsTotal) * 100).toFixed(1))
    : 0;

  return {
    events: {
      total: eventsTotal,
      upcoming: upcomingEvents,
    },
    notices: {
      total: noticesTotal,
    },
    complaints: {
      total: complaintsTotal,
      resolved: resolvedComplaints,
      resolutionRate: `${resolutionRate}%`,
    },
    meetings: {
      total: parentMeetingsTotal,
    },
  };
};

// ── 10. Dynamic Insights & Attention Alerts ──

export const getDynamicInsights = async (schoolId) => {
  const [
    lowAttendanceStudents,
    pendingFeesAgg,
    pendingApplications,
    pendingLeaves,
    timetableConflicts,
    lowestScoringSubjectAgg,
  ] = await Promise.all([
    Attendance.aggregate([
      { $match: { schoolId } },
      { $unwind: '$students' },
      {
        $group: {
          _id: '$students.student',
          total: { $sum: 1 },
          present: {
            $sum: {
              $cond: [{ $in: ['$students.status', ['present', 'late']] }, 1, 0],
            },
          },
        },
      },
      {
        $project: {
          rate: { $multiply: [{ $divide: ['$present', '$total'] }, 100] },
        },
      },
      { $match: { rate: { $lt: 75 } } },
      { $count: 'count' },
    ]),
    FeeTransaction.aggregate([
      { $match: { schoolId, status: { $in: ['pending', 'partial', 'overdue'] } } },
      { $group: { _id: null, total: { $sum: '$balance' }, studentCount: { $addToSet: '$student' } } },
    ]),
    Admission.countDocuments({
      schoolId,
      workflowStatus: { $in: ['submitted', 'document_upload', 'verification', 'under_review', 'payment_pending'] },
    }),
    Leave.countDocuments({ schoolId, requesterModel: 'Teacher', status: 'pending' }),
    Timetable.countDocuments({ schoolId, 'generationLog.severity': 'error' }),
    Mark.aggregate([
      { $match: { schoolId } },
      { $unwind: '$subjectMarks' },
      {
        $group: {
          _id: '$subjectMarks.subject',
          avgScore: { $avg: '$subjectMarks.marksObtained' },
        },
      },
      { $sort: { avgScore: 1 } },
      { $limit: 1 },
      {
        $lookup: {
          from: 'subjects',
          localField: '_id',
          foreignField: '_id',
          as: 'subjectDoc',
        },
      },
      { $unwind: '$subjectDoc' },
    ]),
  ]);

  const lowAttCount = lowAttendanceStudents[0]?.count || 0;
  const pendingFeeTotal = pendingFeesAgg[0]?.total || 0;
  const pendingFeeStudents = pendingFeesAgg[0]?.studentCount?.length || 0;
  const lowestSubject = lowestScoringSubjectAgg[0]?.subjectDoc?.name;

  const insights = [];

  if (lowAttCount > 0) {
    insights.push({
      type: 'attendance',
      severity: 'warning',
      title: 'Low Attendance Alert',
      message: `${lowAttCount} students have attendance below 75% threshold.`,
      link: '/attendance',
      actionText: 'Review Attendance',
    });
  }

  if (pendingFeeTotal > 0) {
    insights.push({
      type: 'fees',
      severity: 'danger',
      title: 'Outstanding Fee Dues',
      message: `₹${pendingFeeTotal.toLocaleString('en-IN')} remains outstanding across ${pendingFeeStudents} students.`,
      link: '/fees',
      actionText: 'Manage Fees',
    });
  }

  if (pendingApplications > 0) {
    insights.push({
      type: 'admissions',
      severity: 'info',
      title: 'Admissions in Progress',
      message: `${pendingApplications} new applications are awaiting verification and review.`,
      link: '/admissions',
      actionText: 'Review Admissions',
    });
  }

  if (pendingLeaves > 0) {
    insights.push({
      type: 'leaves',
      severity: 'warning',
      title: 'Staff Leave Requests',
      message: `${pendingLeaves} teacher leave request${pendingLeaves > 1 ? 's' : ''} require approval.`,
      link: '/leaves',
      actionText: 'View Requests',
    });
  }

  if (timetableConflicts > 0) {
    insights.push({
      type: 'timetable',
      severity: 'danger',
      title: 'Timetable Scheduling Conflict',
      message: `${timetableConflicts} timetable conflict${timetableConflicts > 1 ? 's' : ''} detected.`,
      link: '/timetable',
      actionText: 'Resolve Timetable',
    });
  }

  if (lowestSubject) {
    insights.push({
      type: 'academic',
      severity: 'info',
      title: 'Academic Attention Area',
      message: `${lowestSubject} has the lowest average scoring across recent examinations.`,
      link: '/exams',
      actionText: 'View Exam Marks',
    });
  }

  return insights;
};

// ── 11. Live Chronological Recent Activity ──

export const getRecentActivity = async (schoolId, limit = 10) => {
  const [admissions, fees, leaves, notices] = await Promise.all([
    Admission.find({ schoolId }).sort({ updatedAt: -1 }).limit(limit).select('applicantName workflowStatus appliedClass updatedAt'),
    FeeTransaction.find({ schoolId, status: { $in: ['paid', 'partial'] } }).sort({ updatedAt: -1 }).limit(limit).populate('student', 'firstName lastName').select('paidAmount status updatedAt student'),
    Leave.find({ schoolId }).sort({ createdAt: -1 }).limit(limit).populate('requester', 'firstName lastName name').select('requester requesterModel leaveType status createdAt'),
    Notice.find({ schoolId }).sort({ createdAt: -1 }).limit(limit).select('title audience createdAt'),
  ]);

  const stream = [];

  admissions.forEach((a) => {
    stream.push({
      type: 'admission',
      title: `Admission Application: ${a.applicantName || 'Applicant'}`,
      description: `Status updated to ${a.workflowStatus?.replace(/_/g, ' ')}`,
      time: a.updatedAt || a.createdAt,
      icon: 'UserCheck',
      color: 'bg-indigo-50 text-indigo-600',
    });
  });

  fees.forEach((f) => {
    const studentName = f.student ? `${f.student.firstName} ${f.student.lastName}` : 'Student';
    stream.push({
      type: 'fee',
      title: `Fee Payment Received`,
      description: `₹${(f.paidAmount || 0).toLocaleString('en-IN')} paid by ${studentName}`,
      time: f.updatedAt || f.createdAt,
      icon: 'DollarSign',
      color: 'bg-emerald-50 text-emerald-600',
    });
  });

  leaves.forEach((l) => {
    const requesterName = l.requester?.name || (l.requester?.firstName ? `${l.requester.firstName} ${l.requester.lastName}` : 'Staff');
    stream.push({
      type: 'leave',
      title: `Leave Request (${l.leaveType || 'General'})`,
      description: `${requesterName} submitted a leave request (${l.status})`,
      time: l.createdAt,
      icon: 'GraduationCap',
      color: 'bg-amber-50 text-amber-600',
    });
  });

  notices.forEach((n) => {
    stream.push({
      type: 'notice',
      title: `Notice Published: ${n.title}`,
      description: `Circulated to ${n.audience || 'All'}`,
      time: n.createdAt,
      icon: 'FileCheck',
      color: 'bg-blue-50 text-blue-600',
    });
  });

  stream.sort((a, b) => new Date(b.time) - new Date(a.time));
  return stream.slice(0, limit);
};
