import School from '../models/School.js';
import Student from '../models/Student.js';
import Teacher from '../models/Teacher.js';
import Attendance from '../models/Attendance.js';
import FeeTransaction from '../models/FeeTransaction.js';
import Notice from '../models/Notice.js';
import Admission from '../models/Admission.js';
import Leave from '../models/Leave.js';
import Homework from '../models/Homework.js';
import Exam from '../models/Exam.js';
import RecognitionPoint from '../models/RecognitionPoint.js';
import Subscription from '../models/Subscription.js';
import Timetable from '../models/Timetable.js';
import CalendarEvent from '../models/CalendarEvent.js';
import Syllabus from '../models/Syllabus.js';

import AcademicYear from '../models/AcademicYear.js';
import SchoolClass from '../models/SchoolClass.js';
import Section from '../models/Section.js';
import Subject from '../models/Subject.js';
import Event from '../models/Event.js';
import Mark from '../models/Mark.js';
import ParentMeetingTeacher from '../models/ParentMeetingTeacher.js';
import Notification from '../models/Notification.js';
import FeeStructure from '../models/FeeStructure.js';
import { User } from '../models/User.js';
import AuditLog from '../models/AuditLog.js';
import ApiError from '../utils/ApiError.js';


export const getSuperAdminDashboard = async () => {
  const [
    totalSchools,
    activeSchools,
    inactiveSchools,
    totalStudents,
    totalTeachers,
    totalUsers,
    totalSubscriptions,
    activeSubscriptions,
    trialSubscriptions,
    expiredSubscriptions,
    totalRevenueAgg,
    planDistribution,
    monthlyRevenueAgg,
    recentSchools,
    recentAuditLogs,
  ] = await Promise.all([
    School.countDocuments(),
    School.countDocuments({ status: 'active' }),
    School.countDocuments({ status: { $in: ['inactive', 'suspended'] } }),
    Student.countDocuments({ status: 'active' }),
    Teacher.countDocuments({ status: 'active' }),
    User.countDocuments({ isActive: true }),
    Subscription.countDocuments(),
    Subscription.countDocuments({ status: 'active' }),
    Subscription.countDocuments({ status: 'trial' }),
    Subscription.countDocuments({ status: { $in: ['expired', 'cancelled', 'suspended'] } }),
    FeeTransaction.aggregate([
      { $match: { status: 'paid' } },
      { $group: { _id: null, total: { $sum: '$paidAmount' } } },
    ]),
    Subscription.aggregate([
      { $group: { _id: '$plan', count: { $sum: 1 } } },
    ]),
    FeeTransaction.aggregate([
      { $match: { status: 'paid' } },
      {
        $group: {
          _id: { $dateToString: { format: '%b', date: '$createdAt' } },
          monthIndex: { $first: { $month: '$createdAt' } },
          revenue: { $sum: '$paidAmount' },
          transactions: { $sum: 1 },
        },
      },
      { $sort: { monthIndex: 1 } },
    ]),
    School.find()
      .sort({ createdAt: -1 })
      .limit(6)
      .populate('subscription', 'plan status currentPeriodEnd')
      .select('name code address contact status createdAt subscription'),
    AuditLog.find()
      .sort({ createdAt: -1 })
      .limit(6)
      .populate('actor', 'name email role')
      .populate('schoolId', 'name')
      .select('actor action entity ip createdAt schoolId'),
  ]);

  return {
    stats: {
      totalSchools,
      activeSchools,
      inactiveSchools,
      totalStudents,
      totalTeachers,
      totalUsers,
      totalSubscriptions,
      activeSubscriptions,
      trialSubscriptions,
      expiredSubscriptions,
      totalRevenue: totalRevenueAgg[0]?.total || 0,
    },
    planDistribution: planDistribution.map((p) => ({
      plan: p._id || 'free_trial',
      count: p.count,
    })),
    monthlyRevenue: monthlyRevenueAgg.map((m) => ({
      month: m._id,
      revenue: m.revenue,
      transactions: m.transactions,
    })),
    recentSchools,
    recentAuditLogs,
  };
};

export const getSchoolAdminDashboard = async (schoolId, query = {}) => {
  const attendancePeriod = (query.attendancePeriod || 'week').toLowerCase();
  const classPeriod = (query.classPeriod || query.classAttendancePeriod || 'week').toLowerCase();
  const feePeriod = (query.feePeriod || 'month').toLowerCase();

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

  // Day of week calculation for current week (Monday to Sunday)
  const dayOfWeekIndex = now.getDay(); // 0=Sun, 1=Mon...
  const diffToMon = (dayOfWeekIndex + 6) % 7;
  const startOfWeek = new Date(todayStart);
  startOfWeek.setDate(todayStart.getDate() - diffToMon);
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);

  const startOfLastWeek = new Date(startOfWeek);
  startOfLastWeek.setDate(startOfLastWeek.getDate() - 7);
  const endOfLastWeek = new Date(startOfWeek);
  endOfLastWeek.setMilliseconds(-1);

  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

  // 1. Current Academic Year
  const activeYear = await AcademicYear.findOne({ schoolId, isCurrent: true })
    || await AcademicYear.findOne({ schoolId }).sort({ createdAt: -1 });
  const academicYearId = activeYear?._id;

  // 2. Parallel Core KPI Queries
  const [
    studentCount,
    newAdmissionsMonth,
    teacherCount,
    teachersOnLeaveToday,
    newTeachersMonth,
    todayAttendanceDocs,
    yesterdayDocs,
    feeCollectedAgg,
    feePendingAgg,
    totalFeeStructuresAgg,
    lowAttendanceAgg,
    pendingApplications,
    pendingLeaves,
    timetableConflictsCount,
  ] = await Promise.all([
    // Active students
    Student.countDocuments({ schoolId, status: 'active' }),
    Student.countDocuments({ schoolId, status: 'active', createdAt: { $gte: startOfMonth } }),
    // Active teachers
    Teacher.countDocuments({ schoolId, status: 'active' }),
    Leave.countDocuments({
      schoolId,
      requesterModel: 'Teacher',
      status: 'approved',
      startDate: { $lte: todayEnd },
      endDate: { $gte: todayStart },
    }),
    Teacher.countDocuments({ schoolId, status: 'active', createdAt: { $gte: startOfMonth } }),
    // Today's attendance records
    Attendance.find({ schoolId, date: { $gte: todayStart, $lte: todayEnd } }),
    // Yesterday's attendance records
    Attendance.find({
      schoolId,
      date: {
        $gte: new Date(todayStart.getTime() - 24 * 60 * 60 * 1000),
        $lt: todayStart,
      },
    }),
    // Fee transactions collected (session)
    FeeTransaction.aggregate([
      { $match: { schoolId, ...(academicYearId ? { academicYear: academicYearId } : {}), status: { $in: ['paid', 'partial'] } } },
      { $group: { _id: null, total: { $sum: '$paidAmount' } } },
    ]),
    // Fee transactions pending (session)
    FeeTransaction.aggregate([
      { $match: { schoolId, ...(academicYearId ? { academicYear: academicYearId } : {}), status: { $in: ['pending', 'partial', 'overdue'] } } },
      { $group: { _id: null, total: { $sum: '$balance' }, studentIds: { $addToSet: '$student' } } },
    ]),
    // Fee structures assigned
    FeeStructure.aggregate([
      { $match: { schoolId, ...(academicYearId ? { academicYear: academicYearId } : {}) } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } },
    ]),
    // Students with low attendance (<75%)
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
    // Pending admissions awaiting review
    Admission.countDocuments({
      schoolId,
      workflowStatus: { $in: ['submitted', 'document_upload', 'verification', 'under_review', 'payment_pending'] },
    }),
    // Pending leave requests
    Leave.countDocuments({ schoolId, status: 'pending' }),
    // Timetable conflicts
    Timetable.countDocuments({ schoolId, 'generationLog.severity': 'error' }),
  ]);

  const studentGrowthPercent = studentCount > 0 ? Number(((newAdmissionsMonth / studentCount) * 100).toFixed(1)) : 0;
  const teacherGrowthPercent = teacherCount > 0 ? Number(((newTeachersMonth / teacherCount) * 100).toFixed(1)) : 0;
  const lowAttendanceStudents = lowAttendanceAgg[0]?.count || 0;

  // Compute Today's Attendance KPI
  let todayPresent = 0, todayAbsent = 0, todayLate = 0, todayTotal = 0;
  for (const doc of todayAttendanceDocs) {
    if (doc.summary) {
      todayPresent += doc.summary.present || 0;
      todayAbsent += doc.summary.absent || 0;
      todayLate += doc.summary.late || 0;
      todayTotal += doc.summary.total || 0;
    } else if (Array.isArray(doc.students)) {
      for (const s of doc.students) {
        todayTotal++;
        if (s.status === 'present') todayPresent++;
        else if (s.status === 'absent') todayAbsent++;
        else if (s.status === 'late') todayLate++;
      }
    }
  }
  const todayPercentage = todayTotal > 0
    ? Math.round(((todayPresent + todayLate * 0.5) / todayTotal) * 1000) / 10
    : null;

  let yPres = 0, yTot = 0;
  for (const doc of yesterdayDocs) {
    if (doc.summary) {
      yPres += (doc.summary.present || 0) + ((doc.summary.late || 0) * 0.5);
      yTot += doc.summary.total || 0;
    }
  }
  const yesterdayPercentage = yTot > 0 ? Math.round((yPres / yTot) * 1000) / 10 : null;
  const vsYesterday = (todayPercentage !== null && yesterdayPercentage !== null)
    ? Number((todayPercentage - yesterdayPercentage).toFixed(1))
    : null;

  // Fee KPI calculations
  const collectedSession = feeCollectedAgg[0]?.total || 0;
  const pendingSession = feePendingAgg[0]?.total || 0;
  const pendingStudentsCount = feePendingAgg[0]?.studentIds?.length || 0;
  const targetSession = (collectedSession + pendingSession) || (totalFeeStructuresAgg[0]?.total || 0);
  const feeCollectionRate = targetSession > 0 ? Math.round((collectedSession / targetSession) * 100) : 0;

  // 3. Attendance Overview Chart (Filtered by attendancePeriod)
  let attendanceStartDate = startOfWeek;
  let attendanceEndDate = endOfWeek;
  let prevAttendanceStartDate = startOfLastWeek;
  let prevAttendanceEndDate = endOfLastWeek;

  if (attendancePeriod.includes('today')) {
    attendanceStartDate = todayStart;
    attendanceEndDate = todayEnd;
    prevAttendanceStartDate = new Date(todayStart.getTime() - 24 * 60 * 60 * 1000);
    prevAttendanceEndDate = new Date(todayStart.getTime() - 1);
  } else if (attendancePeriod.includes('month')) {
    attendanceStartDate = startOfMonth;
    attendanceEndDate = endOfMonth;
    prevAttendanceStartDate = startOfLastMonth;
    prevAttendanceEndDate = endOfLastMonth;
  }

  const [periodAttendanceDocs, prevPeriodAttendanceDocs] = await Promise.all([
    Attendance.find({
      schoolId,
      date: { $gte: attendanceStartDate, $lte: attendanceEndDate },
    }).sort({ date: 1 }),
    Attendance.find({
      schoolId,
      date: { $gte: prevAttendanceStartDate, $lte: prevAttendanceEndDate },
    }),
  ]);

  // Aggregate current period data points
  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const attendanceDataMap = {};

  if (attendancePeriod.includes('month')) {
    // Generate buckets for month
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    for (let d = 1; d <= daysInMonth; d++) {
      const dKey = `${d} ${now.toLocaleString('default', { month: 'short' })}`;
      attendanceDataMap[dKey] = { label: dKey, day: `${d}`, dateNum: d, present: 0, absent: 0, total: 0 };
    }
  } else if (attendancePeriod.includes('today')) {
    attendanceDataMap['Today'] = { label: 'Today', day: 'Today', present: 0, absent: 0, total: 0 };
  } else {
    // Week: Mon -> Fri (or Sat)
    ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].forEach((d) => {
      attendanceDataMap[d] = { label: d, day: d, present: 0, absent: 0, total: 0 };
    });
  }

  for (const doc of periodAttendanceDocs) {
    const d = new Date(doc.date);
    let key;
    if (attendancePeriod.includes('month')) {
      key = `${d.getDate()} ${d.toLocaleString('default', { month: 'short' })}`;
    } else if (attendancePeriod.includes('today')) {
      key = 'Today';
    } else {
      key = dayLabels[d.getDay()];
    }

    if (attendanceDataMap[key]) {
      const pres = doc.summary?.present || 0;
      const abs = doc.summary?.absent || 0;
      const late = doc.summary?.late || 0;
      const tot = doc.summary?.total || (pres + abs + late);
      attendanceDataMap[key].present += (pres + late * 0.5);
      attendanceDataMap[key].absent += abs;
      attendanceDataMap[key].total += tot;
    }
  }

  const attendanceData = Object.values(attendanceDataMap)
    .filter((item) => {
      if (attendancePeriod.includes('month') && item.dateNum > now.getDate() && item.total === 0) {
        return false; // don't show future empty days of month
      }
      return true;
    })
    .map((item) => ({
      day: item.day,
      label: item.label,
      attendance: item.total > 0 ? Math.round((item.present / item.total) * 100) : null,
      present: Math.round(item.present),
      absent: item.absent,
    }));

  // Calculate current period average attendance
  let currTotPres = 0, currTotExpected = 0;
  for (const doc of periodAttendanceDocs) {
    if (doc.summary?.total) {
      currTotPres += (doc.summary.present || 0) + ((doc.summary.late || 0) * 0.5);
      currTotExpected += doc.summary.total;
    }
  }
  const currentPeriodAverage = currTotExpected > 0 ? Math.round((currTotPres / currTotExpected) * 1000) / 10 : null;

  let prevTotPres = 0, prevTotExpected = 0;
  for (const doc of prevPeriodAttendanceDocs) {
    if (doc.summary?.total) {
      prevTotPres += (doc.summary.present || 0) + ((doc.summary.late || 0) * 0.5);
      prevTotExpected += doc.summary.total;
    }
  }
  const prevPeriodAverage = prevTotExpected > 0 ? Math.round((prevTotPres / prevTotExpected) * 1000) / 10 : null;
  const vsPreviousPeriod = (currentPeriodAverage !== null && prevPeriodAverage !== null)
    ? Number((currentPeriodAverage - prevPeriodAverage).toFixed(1))
    : null;

  // 4. Today's Schedule (Published timetable for current day)
  const currentDayOfWeek = now.getDay();
  const publishedTimetables = await Timetable.find({
    schoolId,
    ...(academicYearId ? { academicYear: academicYearId } : {}),
    status: 'published',
  })
    .populate('schoolClass', 'name')
    .populate('section', 'name')
    .populate('periods.subject', 'name code')
    .populate('periods.teacher', 'firstName lastName');

  const scheduleColors = ['border-l-forest', 'border-l-info', 'border-l-warning', 'border-l-danger', 'border-l-purple-500', 'border-l-emerald-600'];
  let colorIdx = 0;
  const scheduleItems = [];

  for (const tt of publishedTimetables) {
    for (const p of (tt.periods || [])) {
      if (p.day === currentDayOfWeek) {
        scheduleItems.push({
          time: p.startTime ? `${p.startTime}${p.endTime ? ` - ${p.endTime}` : ''}` : `Period ${p.periodNo}`,
          startTime: p.startTime || `0${p.periodNo}:00`,
          subject: p.isLunch ? 'Lunch Break' : p.isBreak ? (p.label || 'Break') : (p.subject?.name || 'Class Session'),
          classRoom: `${tt.schoolClass?.name || 'Class'}${tt.section?.name ? ` ${tt.section.name}` : ''} • Room ${p.room || '204'}`,
          teacher: p.teacher ? `${p.teacher.firstName} ${p.teacher.lastName}` : (p.isLunch || p.isBreak ? '' : 'Staff'),
          isBreak: !!(p.isLunch || p.isBreak || p.isAssembly),
          color: p.isLunch || p.isBreak ? 'border-l-border' : scheduleColors[colorIdx++ % scheduleColors.length],
        });
      }
    }
  }
  scheduleItems.sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''));

  // 5. Attendance by Class (Filtered by classPeriod)
  let classStartDate = startOfWeek;
  let classEndDate = endOfWeek;
  let prevClassStartDate = startOfLastWeek;
  let prevClassEndDate = endOfLastWeek;

  if (classPeriod.includes('today')) {
    classStartDate = todayStart;
    classEndDate = todayEnd;
    prevClassStartDate = new Date(todayStart.getTime() - 24 * 60 * 60 * 1000);
    prevClassEndDate = new Date(todayStart.getTime() - 1);
  } else if (classPeriod.includes('month')) {
    classStartDate = startOfMonth;
    classEndDate = endOfMonth;
    prevClassStartDate = startOfLastMonth;
    prevClassEndDate = endOfLastMonth;
  }

  const [activeClasses, classAttendanceDocs, prevClassAttendanceDocs] = await Promise.all([
    SchoolClass.find({ schoolId, ...(academicYearId ? { academicYear: academicYearId } : {}) }).sort('order name').limit(8),
    Attendance.find({
      schoolId,
      date: { $gte: classStartDate, $lte: classEndDate },
    }),
    Attendance.find({
      schoolId,
      date: { $gte: prevClassStartDate, $lte: prevClassEndDate },
    }),
  ]);

  const classAttendance = activeClasses.map((cls) => {
    const clsDocs = classAttendanceDocs.filter((d) => d.schoolClass?.toString() === cls._id.toString());
    const prevClsDocs = prevClassAttendanceDocs.filter((d) => d.schoolClass?.toString() === cls._id.toString());

    let pres = 0, tot = 0;
    for (const d of clsDocs) {
      if (d.summary?.total) {
        pres += (d.summary.present || 0) + ((d.summary.late || 0) * 0.5);
        tot += d.summary.total;
      }
    }
    const percentage = tot > 0 ? Math.round((pres / tot) * 1000) / 10 : 0;

    let pPres = 0, pTot = 0;
    for (const d of prevClsDocs) {
      if (d.summary?.total) {
        pPres += (d.summary.present || 0) + ((d.summary.late || 0) * 0.5);
        pTot += d.summary.total;
      }
    }
    const prevPct = pTot > 0 ? Math.round((pPres / pTot) * 1000) / 10 : null;
    const diff = prevPct !== null ? Number((percentage - prevPct).toFixed(1)) : null;

    return {
      classId: cls._id,
      class: cls.name,
      percentage,
      change: diff !== null ? (diff >= 0 ? `+${diff}%` : `${diff}%`) : '—',
      up: diff !== null ? diff >= 0 : true,
    };
  });

  // 6. Fee Collection Donut (Filtered by feePeriod)
  let feeStartDate = startOfMonth;
  let feeEndDate = endOfMonth;

  if (feePeriod.includes('today')) {
    feeStartDate = todayStart;
    feeEndDate = todayEnd;
  } else if (feePeriod.includes('week')) {
    feeStartDate = startOfWeek;
    feeEndDate = endOfWeek;
  } else if (feePeriod.includes('session')) {
    feeStartDate = activeYear?.startDate || new Date(now.getFullYear(), 0, 1);
    feeEndDate = activeYear?.endDate || new Date(now.getFullYear(), 11, 31);
  }

  const [periodFeeCollectedAgg, periodFeePendingAgg] = await Promise.all([
    FeeTransaction.aggregate([
      {
        $match: {
          schoolId,
          status: { $in: ['paid', 'partial'] },
          paymentDate: { $gte: feeStartDate, $lte: feeEndDate },
        },
      },
      { $group: { _id: null, total: { $sum: '$paidAmount' } } },
    ]),
    FeeTransaction.aggregate([
      {
        $match: {
          schoolId,
          status: { $in: ['pending', 'partial', 'overdue'] },
          createdAt: { $lte: feeEndDate },
        },
      },
      { $group: { _id: null, total: { $sum: '$balance' } } },
    ]),
  ]);

  const periodCollected = periodFeeCollectedAgg[0]?.total || 0;
  const periodPending = periodFeePendingAgg[0]?.total || 0;
  const periodTarget = (periodCollected + periodPending) || (totalFeeStructuresAgg[0]?.total || 0);

  const feeDonutData = [
    { name: 'Collected', value: periodCollected, color: '#2D6A4F' },
    { name: 'Pending', value: periodPending, color: '#D97706' },
  ];

  // 7. Recent Activities Aggregation
  const [recentAdmissions, recentPayments, recentLeaves, recentNotices] = await Promise.all([
    Admission.find({ schoolId }).sort({ updatedAt: -1 }).limit(3).populate('applyingForClass', 'name'),
    FeeTransaction.find({ schoolId, paidAmount: { $gt: 0 } }).sort({ updatedAt: -1 }).limit(3).populate('student', 'firstName lastName'),
    Leave.find({ schoolId }).sort({ updatedAt: -1 }).limit(3).populate('requester', 'name email'),
    Notice.find({ schoolId, status: 'published' }).sort({ createdAt: -1 }).limit(3),
  ]);

  const recentActivities = [];

  for (const adm of recentAdmissions) {
    recentActivities.push({
      time: adm.updatedAt,
      title: adm.workflowStatus === 'approved' ? 'Admission approved' : `Admission ${adm.workflowStatus.replace('_', ' ')}`,
      desc: `${adm.firstName} ${adm.lastName} applied for ${adm.applyingForClass?.name || 'Class'}`,
      type: 'admission',
      icon: 'UserCheck',
      color: 'bg-forest-soft text-forest',
    });
  }

  for (const fee of recentPayments) {
    const sName = fee.student ? `${fee.student.firstName} ${fee.student.lastName}` : 'Student';
    recentActivities.push({
      time: fee.paymentDate || fee.updatedAt,
      title: 'Fee payment received',
      desc: `₹${(fee.paidAmount || 0).toLocaleString('en-IN')} received from ${sName}`,
      type: 'fee',
      icon: 'DollarSign',
      color: 'bg-info-light text-info-text',
    });
  }

  for (const lv of recentLeaves) {
    recentActivities.push({
      time: lv.updatedAt,
      title: lv.status === 'approved' ? 'Leave request approved' : `Leave request ${lv.status}`,
      desc: `${lv.requester?.name || 'Staff Member'} — ${lv.type} leave (${lv.reason?.slice(0, 30) || 'Personal'})`,
      type: 'leave',
      icon: 'CheckCircle2',
      color: 'bg-surface text-secondary',
    });
  }

  for (const n of recentNotices) {
    recentActivities.push({
      time: n.createdAt,
      title: 'Notice published',
      desc: n.title,
      type: 'notice',
      icon: 'FileCheck',
      color: 'bg-sage text-forest',
    });
  }

  recentActivities.sort((a, b) => new Date(b.time) - new Date(a.time));

  return {
    summary: {
      studentCount,
      newAdmissionsMonth,
      studentGrowthPercent: Number(studentGrowthPercent),
      teacherCount,
      teachersOnLeaveToday,
      teacherGrowthPercent: Number(teacherGrowthPercent),
      todayAttendance: {
        percentage: todayPercentage,
        absentCount: todayAbsent,
        vsYesterday,
      },
      feesCollected: {
        collectedSession,
        pendingSession,
        targetSession,
        feeCollectionRate,
      },
    },
    needsAttention: {
      lowAttendanceCount: lowAttendanceStudents,
      pendingApplications,
      pendingFeesAmount: pendingSession,
      pendingFeesStudentCount: pendingStudentsCount,
      pendingLeaves,
      timetableConflicts: timetableConflictsCount,
    },
    attendanceOverview: {
      period: attendancePeriod,
      averagePercentage: currentPeriodAverage,
      vsPreviousPeriod,
      data: attendanceData,
    },
    todaysSchedule: scheduleItems,
    attendanceByClass: classAttendance,
    feeCollection: {
      period: feePeriod,
      collected: periodCollected,
      pending: periodPending,
      target: periodTarget,
      collectedPercentage: periodTarget > 0 ? Math.round((periodCollected / periodTarget) * 100) : 0,
      pendingPercentage: periodTarget > 0 ? Math.round((periodPending / periodTarget) * 100) : 0,
      donutData: feeDonutData,
    },
    recentActivities: recentActivities.slice(0, 6),
  };
};


export const getTeacherDashboard = async (user, schoolId, query = {}) => {
  // 1. Identify authenticated teacher
  let teacher = null;
  if (user?.profileId) {
    teacher = await Teacher.findOne({ _id: user.profileId, schoolId })
      .populate('subjects', 'name code category weeklyPeriods')
      .populate('assignedClasses', 'name')
      .populate('assignedSections', 'name roomNo')
      .populate('classTeacherOf', 'name')
      .populate('classTeacherSection', 'name');
  }
  if (!teacher && user?.email) {
    teacher = await Teacher.findOne({ schoolId, 'contact.email': user.email.toLowerCase().trim() })
      .populate('subjects', 'name code category weeklyPeriods')
      .populate('assignedClasses', 'name')
      .populate('assignedSections', 'name roomNo')
      .populate('classTeacherOf', 'name')
      .populate('classTeacherSection', 'name');
  }
  if (!teacher) {
    throw new ApiError(404, 'Teacher profile not found for this user account');
  }

  // 2. Active academic year and school info
  const school = await School.findById(schoolId).populate('academicSession.currentAcademicYear');
  let academicYearId = school?.academicSession?.currentAcademicYear?._id || school?.academicSession?.currentAcademicYear;
  if (!academicYearId) {
    const activeYear = await AcademicYear.findOne({ schoolId, status: 'active' }) || await AcademicYear.findOne({ schoolId }).sort({ startDate: -1 });
    academicYearId = activeYear?._id;
  }

  // 3. Date & time calculations
  const now = new Date();
  const todayDayNumber = now.getDay(); // 0: Sun, 1: Mon, ... 6: Sat
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  // 4. Timetable for teacher
  const timetables = await Timetable.find({
    schoolId,
    status: 'published',
    ...(academicYearId ? { academicYear: academicYearId } : {})
  })
    .populate('schoolClass', 'name')
    .populate('section', 'name roomNo')
    .populate('periods.subject', 'name code category');

  const todaysLectures = [];
  const teacherClassSectionMap = new Map();
  const teacherSubjectIds = new Set((teacher.subjects || []).map((s) => s._id?.toString() || s.toString()));
  const teacherClassIds = new Set((teacher.assignedClasses || []).map((c) => c._id?.toString() || c.toString()));
  const teacherSectionIds = new Set((teacher.assignedSections || []).map((s) => s._id?.toString() || s.toString()));

  let totalWeeklyPeriods = 0;
  const dayPeriodCounts = [0, 0, 0, 0, 0, 0, 0];

  for (const t of timetables) {
    const classId = t.schoolClass?._id?.toString();
    const sectionId = t.section?._id?.toString();

    const myPeriods = (t.periods || []).filter((p) => p.teacher && p.teacher.toString() === teacher._id.toString());
    for (const p of myPeriods) {
      if (classId) teacherClassIds.add(classId);
      if (sectionId) teacherSectionIds.add(sectionId);
      if (p.subject?._id) teacherSubjectIds.add(p.subject._id.toString());

      if (!p.isBreak && !p.isLunch) {
        totalWeeklyPeriods++;
        if (p.day >= 0 && p.day <= 6) {
          dayPeriodCounts[p.day]++;
        }
      }

      if (classId && sectionId) {
        const csKey = `${classId}_${sectionId}`;
        if (!teacherClassSectionMap.has(csKey)) {
          teacherClassSectionMap.set(csKey, {
            classId: t.schoolClass._id,
            className: t.schoolClass.name,
            sectionId: t.section._id,
            sectionName: t.section.name,
            room: t.section.roomNo || p.room || '',
            subjects: new Map(),
          });
        }
        if (p.subject) {
          teacherClassSectionMap.get(csKey).subjects.set(p.subject._id.toString(), {
            id: p.subject._id,
            name: p.subject.name,
            code: p.subject.code,
          });
        }
      }

      if (p.day === todayDayNumber) {
        todaysLectures.push({
          periodNo: p.periodNo,
          startTime: p.startTime || '',
          endTime: p.endTime || '',
          schoolClass: t.schoolClass ? { _id: t.schoolClass._id, name: t.schoolClass.name } : null,
          section: t.section ? { _id: t.section._id, name: t.section.name } : null,
          subject: p.subject ? { _id: p.subject._id, name: p.subject.name, code: p.subject.code } : null,
          room: p.room || t.section?.roomNo || '',
          isLunch: p.isLunch || false,
          isBreak: p.isBreak || false,
          label: p.label || '',
        });
      }
    }
  }

  // Also include assigned classes/sections that may not have timetable periods yet
  if (teacher.assignedClasses) {
    for (const c of teacher.assignedClasses) {
      if (c && c._id) teacherClassIds.add(c._id.toString());
    }
  }
  if (teacher.assignedSections) {
    for (const s of teacher.assignedSections) {
      if (s && s._id) teacherSectionIds.add(s._id.toString());
    }
  }

  // Sort today's lectures by startTime ASC or periodNo ASC
  todaysLectures.sort((a, b) => {
    if (a.startTime && b.startTime) return a.startTime.localeCompare(b.startTime);
    return a.periodNo - b.periodNo;
  });

  // 5. Today's Attendance
  const todayAttendanceRecords = await Attendance.find({
    schoolId,
    date: { $gte: startOfToday, $lte: endOfToday },
  });

  let attendancePendingCount = 0;
  const todaysSchedule = todaysLectures.map((lec) => {
    if (lec.isBreak || lec.isLunch) {
      return { ...lec, attendanceMarked: true };
    }
    const classId = lec.schoolClass?._id?.toString();
    const sectionId = lec.section?._id?.toString();
    const subjectId = lec.subject?._id?.toString();

    const isMarked = todayAttendanceRecords.some((att) => {
      const attClass = att.schoolClass?.toString();
      const attSection = att.section?.toString();
      const attSubject = att.subject?.toString();
      const attPeriod = att.period;

      if (attClass !== classId) return false;
      if (sectionId && attSection && attSection !== sectionId) return false;
      if (subjectId && attSubject && attSubject !== subjectId) return false;
      if (attPeriod !== undefined && attPeriod !== null && attPeriod !== lec.periodNo) return false;
      return true;
    });

    if (!isMarked) {
      attendancePendingCount++;
    }

    return {
      ...lec,
      attendanceMarked: isMarked,
    };
  });

  // 6. Distinct Students Taught
  const classFilter = Array.from(teacherClassIds);
  const sectionFilter = Array.from(teacherSectionIds);

  const studentMatchConditions = [];
  if (classFilter.length > 0) studentMatchConditions.push({ currentClass: { $in: classFilter } });
  if (sectionFilter.length > 0) studentMatchConditions.push({ currentSection: { $in: sectionFilter } });

  const studentsInTeacherClasses = studentMatchConditions.length > 0
    ? await Student.find({
        schoolId,
        status: 'active',
        $or: studentMatchConditions,
      }).select('_id currentClass currentSection')
    : [];

  const totalStudentsTaught = studentsInTeacherClasses.length;

  // Build my classes array
  const myClasses = [];
  for (const [key, cs] of teacherClassSectionMap.entries()) {
    const count = studentsInTeacherClasses.filter((s) =>
      s.currentClass?.toString() === cs.classId.toString() &&
      (!cs.sectionId || s.currentSection?.toString() === cs.sectionId.toString())
    ).length;

    myClasses.push({
      classId: cs.classId,
      className: cs.className,
      sectionId: cs.sectionId,
      sectionName: cs.sectionName,
      room: cs.room,
      subjects: Array.from(cs.subjects.values()),
      studentCount: count,
      isClassTeacher: !!(
        teacher.isClassTeacher &&
        (teacher.classTeacherOf?._id?.toString() === cs.classId.toString() ||
          teacher.classTeacherOf?.toString() === cs.classId.toString()) &&
        (!teacher.classTeacherSection ||
          teacher.classTeacherSection?._id?.toString() === cs.sectionId.toString() ||
          teacher.classTeacherSection?.toString() === cs.sectionId.toString())
      ),
    });
  }

  // 7. My Subjects
  const subjectIdsArray = Array.from(teacherSubjectIds);
  let mySubjects = [];
  if (subjectIdsArray.length > 0) {
    const subjectsFromDb = await Subject.find({ schoolId, _id: { $in: subjectIdsArray } }).select('name code category weeklyPeriods');
    mySubjects = subjectsFromDb.map((sub) => {
      const classesForSubject = [];
      for (const cs of myClasses) {
        if (cs.subjects.some((s) => s.id.toString() === sub._id.toString())) {
          classesForSubject.push(`${cs.className}${cs.sectionName ? ` - ${cs.sectionName}` : ''}`);
        }
      }
      return {
        _id: sub._id,
        name: sub.name,
        code: sub.code,
        category: sub.category,
        weeklyPeriods: sub.weeklyPeriods || 0,
        assignedClasses: classesForSubject,
      };
    });
  }

  // 8. Homework
  const [teacherHomework, pendingHomeworkCount, totalHomeworkCount] = await Promise.all([
    Homework.find({
      schoolId,
      teacher: teacher._id,
      ...(academicYearId ? { academicYear: academicYearId } : {})
    })
      .sort({ createdAt: -1 })
      .limit(6)
      .populate('subject', 'name code')
      .populate('schoolClass', 'name')
      .populate('section', 'name'),
    Homework.countDocuments({
      schoolId,
      teacher: teacher._id,
      status: { $in: ['draft', 'published'] },
      dueDate: { $gte: startOfToday },
    }),
    Homework.countDocuments({ schoolId, teacher: teacher._id }),
  ]);

  const recentHomework = teacherHomework.map((hw) => ({
    _id: hw._id,
    title: hw.title,
    subjectName: hw.subject?.name || 'Subject',
    className: hw.schoolClass?.name || 'Class',
    sectionName: hw.section?.name || '',
    dueDate: hw.dueDate,
    assignedDate: hw.assignedDate,
    status: hw.status,
    submissionsCount: (hw.submissions || []).length,
  }));

  // 9. Exams & Pending Marks
  const teacherExams = classFilter.length > 0
    ? await Exam.find({
        schoolId,
        schoolClass: { $in: classFilter },
        status: { $in: ['upcoming', 'ongoing', 'completed', 'published'] },
        ...(academicYearId ? { academicYear: academicYearId } : {}),
      })
        .sort({ startDate: 1 })
        .limit(8)
        .populate('schoolClass', 'name')
        .populate('subjects.subject', 'name code')
    : [];

  const upcomingExams = [];
  let pendingMarksCount = 0;

  for (const ex of teacherExams) {
    const myExamSubjects = (ex.subjects || []).filter((s) =>
      teacherSubjectIds.has(s.subject?._id?.toString())
    );

    if (myExamSubjects.length > 0 || classFilter.includes(ex.schoolClass?._id?.toString())) {
      if (['upcoming', 'ongoing'].includes(ex.status)) {
        upcomingExams.push({
          _id: ex._id,
          name: ex.name,
          type: ex.type,
          status: ex.status,
          startDate: ex.startDate,
          endDate: ex.endDate,
          className: ex.schoolClass?.name,
          classId: ex.schoolClass?._id,
          subjects: myExamSubjects.map((s) => ({
            subjectId: s.subject?._id,
            subjectName: s.subject?.name,
            maxMarks: s.maxMarks,
            passMarks: s.passMarks,
            date: s.date,
            startTime: s.startTime,
            endTime: s.endTime,
          })),
        });
      }

      if (['ongoing', 'completed', 'published'].includes(ex.status)) {
        for (const sub of myExamSubjects) {
          const marksExist = await Mark.exists({
            schoolId,
            exam: ex._id,
            subject: sub.subject._id,
            status: 'submitted',
          });
          if (!marksExist) {
            pendingMarksCount++;
          }
        }
      }
    }
  }

  // 10. Syllabus Progress
  const syllabusList = subjectIdsArray.length > 0 && classFilter.length > 0
    ? await Syllabus.find({
        schoolId,
        subject: { $in: subjectIdsArray },
        schoolClass: { $in: classFilter },
        ...(academicYearId ? { academicYear: academicYearId } : {}),
      })
        .populate('subject', 'name code')
        .populate('schoolClass', 'name')
    : [];

  const syllabusProgress = syllabusList.map((syl) => {
    const totalChapters = syl.chapters?.length || 0;
    const completedChapters = (syl.chapters || []).filter((c) => c.status === 'completed').length;
    const inProgressChapters = (syl.chapters || []).filter((c) => c.status === 'in_progress').length;

    return {
      _id: syl._id,
      subjectName: syl.subject?.name || 'Subject',
      className: syl.schoolClass?.name || 'Class',
      totalCompletion: syl.totalCompletion || 0,
      totalChapters,
      completedChapters,
      inProgressChapters,
    };
  });

  // 11. Workload
  const weeklyLimit = teacher.weeklyTeachingLimit || 30;
  const dailyLimit = teacher.dailyTeachingLimit || 6;
  const todaysPeriodsCount = dayPeriodCounts[todayDayNumber] || 0;

  const workload = {
    weeklyPeriods: totalWeeklyPeriods,
    weeklyLimit,
    dailyPeriodsToday: todaysPeriodsCount,
    dailyLimit,
    freePeriodsToday: Math.max(0, 8 - todaysPeriodsCount),
    weeklyUtilization: weeklyLimit > 0 ? Math.min(100, Math.round((totalWeeklyPeriods / weeklyLimit) * 100)) : 0,
    dailyDistribution: [
      { day: 'Mon', periods: dayPeriodCounts[1] },
      { day: 'Tue', periods: dayPeriodCounts[2] },
      { day: 'Wed', periods: dayPeriodCounts[3] },
      { day: 'Thu', periods: dayPeriodCounts[4] },
      { day: 'Fri', periods: dayPeriodCounts[5] },
      { day: 'Sat', periods: dayPeriodCounts[6] },
    ],
  };

  // 12. Leaves
  const [leaves, pendingLeaves, upcomingLeave] = await Promise.all([
    Leave.find({
      schoolId,
      requester: user._id,
      requesterModel: 'Teacher',
    }).sort({ createdAt: -1 }).limit(5),
    Leave.countDocuments({
      schoolId,
      requester: user._id,
      requesterModel: 'Teacher',
      status: 'pending',
    }),
    Leave.findOne({
      schoolId,
      requester: user._id,
      requesterModel: 'Teacher',
      status: 'approved',
      startDate: { $gte: startOfToday },
    }).sort({ startDate: 1 }),
  ]);

  // 13. Notices & Events & Meetings & Notifications & Activity
  const [notices, events, meetingAssignments, notifications, unreadNotificationsCount, recentAuditLogs] = await Promise.all([
    Notice.find({
      schoolId,
      status: 'published',
      $or: [
        { scope: { $in: ['school', 'teacher'] } },
        ...(classFilter.length > 0 ? [{ targetClasses: { $in: classFilter } }] : []),
      ],
    }).sort({ isPinned: -1, createdAt: -1 }).limit(5).select('title content category isPinned createdAt'),
    Event.find({
      schoolId,
      status: { $in: ['upcoming', 'ongoing'] },
      startDate: { $gte: startOfToday },
      audience: { $in: ['all', 'teachers'] },
    }).sort({ startDate: 1 }).limit(5).select('title type startDate endDate startTime endTime location isFullDay color'),
    ParentMeetingTeacher.find({
      schoolId,
      teacher: teacher._id,
    }).populate('meetingId').populate('schoolClass', 'name').populate('section', 'name'),
    Notification.find({ recipient: user._id }).sort({ createdAt: -1 }).limit(5),
    Notification.countDocuments({ recipient: user._id, isRead: false }),
    AuditLog.find({
      schoolId,
      actor: user._id,
    }).sort({ createdAt: -1 }).limit(6).select('action entity entityId createdAt'),
  ]);

  const parentMeetings = meetingAssignments
    .filter((ma) => ma.meetingId && ma.meetingId.status === 'PUBLISHED')
    .map((ma) => ({
      _id: ma.meetingId._id,
      title: ma.meetingId.title,
      description: ma.meetingId.description,
      date: ma.meetingId.date,
      startTime: ma.meetingId.startTime,
      endTime: ma.meetingId.endTime,
      meetingType: ma.meetingId.meetingType,
      location: ma.meetingId.location,
      meetingLink: ma.meetingId.meetingLink,
      className: ma.schoolClass?.name || '',
      sectionName: ma.section?.name || '',
    }))
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(0, 5);

  const recentActivity = recentAuditLogs.map((log) => ({
    _id: log._id,
    action: log.action,
    entity: log.entity,
    createdAt: log.createdAt,
  }));

  // 14. Summary object
  const summary = {
    todaysClasses: todaysSchedule.filter((p) => !p.isBreak && !p.isLunch).length,
    studentsTaught: totalStudentsTaught,
    attendancePending: attendancePendingCount,
    homeworkPending: pendingHomeworkCount,
    upcomingExams: upcomingExams.length,
    marksPending: pendingMarksCount,
    pendingLeaves,
    weeklyPeriods: totalWeeklyPeriods,
  };

  return {
    teacher: {
      _id: teacher._id,
      name: `${teacher.firstName} ${teacher.lastName}`.trim(),
      employeeId: teacher.employeeId,
      department: teacher.department || '',
      gender: teacher.gender || '',
      avatar: user.avatar || '',
      isClassTeacher: teacher.isClassTeacher || false,
      classTeacherOf: teacher.classTeacherOf?.name || null,
      classTeacherSection: teacher.classTeacherSection?.name || null,
    },
    school: {
      _id: school?._id,
      name: school?.name || 'School',
      academicSessionName: school?.academicSession?.currentAcademicYear?.name || '',
    },
    summary,
    todaysSchedule,
    classes: myClasses,
    subjects: mySubjects,
    homework: {
      summary: { total: totalHomeworkCount, pending: pendingHomeworkCount },
      recent: recentHomework,
    },
    upcomingExams,
    marksPendingCount: pendingMarksCount,
    syllabusProgress,
    workload,
    leave: {
      recent: leaves,
      pendingCount: pendingLeaves,
      upcoming: upcomingLeave,
    },
    notices,
    events,
    parentMeetings,
    notifications,
    unreadNotificationsCount,
    recentActivity,
  };
};

export const getStudentDashboard = async (studentId, schoolId) => {
  const [attendance, homework, fees, results, notices, recognition, timetable, events] = await Promise.all([
    Attendance.find({ schoolId, 'students.student': studentId }).sort('-date').limit(30),
    Homework.find({ schoolId, schoolClass: (await Student.findById(studentId))?.currentClass }).sort('-createdAt').limit(5),
    FeeTransaction.find({ schoolId, student: studentId }),
    Exam.find({ schoolId, status: 'published' }),
    Notice.find({ schoolId, status: 'published' }).sort('-createdAt').limit(5),
    RecognitionPoint.find({ schoolId, student: studentId }).sort('-createdAt'),
    Timetable.findOne({ schoolId, status: 'published' }),
    CalendarEvent.find({ schoolId, startDate: { $gte: new Date() } }).sort('startDate').limit(5),
  ]);

  return { attendance, homework, fees, results, notices, recognition, timetable, events };
};

export const getParentDashboard = async (user, schoolId, studentId) => {
  const { getMyChildren, getChildDashboard } = await import('./parent.service.js');
  if (studentId) {
    return getChildDashboard(studentId, user, schoolId);
  }
  const { children, parent } = await getMyChildren(user, schoolId);
  if (children.length > 0) {
    const childData = await getChildDashboard(children[0].id, user, schoolId);
    return { ...childData, children, parent };
  }
  return { children: [], parent, student: null };
};

