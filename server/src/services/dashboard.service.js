import mongoose from 'mongoose';
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
import User from '../models/User.js';
import AuditLog from '../models/AuditLog.js';
import SchoolClass from '../models/SchoolClass.js';

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Returns array of last N day date strings (YYYY-MM-DD), oldest first */
function lastNDays(n) {
  const days = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - i);
    days.push(d);
  }
  return days;
}

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// ── Super Admin Dashboard ─────────────────────────────────────────────────────

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

// ── School Admin Dashboard ────────────────────────────────────────────────────

export const getSchoolAdminDashboard = async (schoolId) => {
  const sid = new mongoose.Types.ObjectId(schoolId);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split('T')[0];
  const todayDayOfWeek = today.getDay(); // 0=Sun, 1=Mon, ...

  // Date ranges
  const now = new Date();
  const utcStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
  const localStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);

  const startOfToday = new Date(Math.min(utcStart.getTime(), localStart.getTime()));
  const endOfToday = new Date(Math.max(utcStart.getTime() + 86399999, localStart.getTime() + 86399999));
  const todayFilter = { $gte: startOfToday, $lte: endOfToday };

  const last7 = lastNDays(7);
  const weekStart = last7[0];
  const last30 = lastNDays(30);
  const monthStart = last30[0];

  const getClassAttendanceForPeriod = (startDate, endDate = null) => {
    const matchQuery = { schoolId: sid };
    if (endDate) {
      matchQuery.date = { $gte: startDate, $lte: endDate };
    } else {
      matchQuery.date = { $gte: startDate };
    }
    return Attendance.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$schoolClass',
          present: { $sum: '$summary.present' },
          total: { $sum: '$summary.total' },
        },
      },
      {
        $lookup: {
          from: 'schoolclasses',
          localField: '_id',
          foreignField: '_id',
          as: 'classInfo',
        },
      },
      { $unwind: { path: '$classInfo', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          class: { $ifNull: ['$classInfo.name', 'Unknown'] },
          present: 1,
          total: 1,
          percentage: {
            $cond: [
              { $gt: ['$total', 0] },
              { $multiply: [{ $divide: ['$present', '$total'] }, 100] },
              0,
            ],
          },
        },
      },
      { $sort: { percentage: -1 } },
      { $limit: 10 },
    ]);
  };

  const [
    allClasses,
    studentCount,
    teacherCount,
    todayAttendanceDocs,
    feeAgg,
    admissionApplications,
    pendingLeaves,
    teachersOnLeave,
    weeklyAttendanceAgg,
    monthlyAttendanceAgg,
    todayClassAttendanceAgg,
    classAttToday,
    classAttWeek,
    classAttMonth,
    timetables,
    timetableConflictAgg,
    lowAttendanceCount,
    recentAuditLogs,
    upcomingEvents,
    newAdmissionsThisMonth,
  ] = await Promise.all([
    // 0. All school classes
    SchoolClass.find({ schoolId: sid }).sort({ order: 1, name: 1 }).select('name'),

    // 1. Student count
    Student.countDocuments({ schoolId: sid, status: 'active' }),

    // 2. Teacher count
    Teacher.countDocuments({ schoolId: sid, status: 'active' }),

    // 3. Today's attendance (all classes, aggregate totals)
    Attendance.find({ schoolId: sid, date: todayFilter }).select('summary schoolClass'),

    // 4. Fee aggregation: total billed, paid, pending
    FeeTransaction.aggregate([
      { $match: { schoolId: sid } },
      {
        $group: {
          _id: null,
          totalBilled: { $sum: '$amount' },
          totalPaid: { $sum: { $cond: [{ $eq: ['$status', 'paid'] }, '$paidAmount', 0] } },
          totalPending: {
            $sum: {
              $cond: [
                { $in: ['$status', ['pending', 'overdue', 'partial']] },
                '$balance',
                0,
              ],
            },
          },
          pendingStudents: {
            $addToSet: {
              $cond: [{ $in: ['$status', ['pending', 'overdue']] }, '$student', '$$REMOVE'],
            },
          },
        },
      },
    ]),

    // 5. Pending admission applications
    Admission.countDocuments({
      schoolId: sid,
      workflowStatus: { $in: ['submitted', 'document_upload', 'verification'] },
    }),

    // 6. Pending teacher leave requests
    Leave.countDocuments({ schoolId: sid, status: 'pending', requesterModel: 'Teacher' }),

    // 7. Teachers on leave today (approved leaves covering today)
    Leave.countDocuments({
      schoolId: sid,
      requesterModel: 'Teacher',
      status: 'approved',
      startDate: { $lte: endOfToday },
      endDate: { $gte: startOfToday },
    }),

    // 8. Weekly attendance trend (last 7 days)
    Attendance.aggregate([
      { $match: { schoolId: sid, date: { $gte: weekStart } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
          present: { $sum: '$summary.present' },
          absent: { $sum: '$summary.absent' },
          total: { $sum: '$summary.total' },
        },
      },
      { $sort: { _id: 1 } },
    ]),

    // 9. Monthly attendance trend (last 30 days)
    Attendance.aggregate([
      { $match: { schoolId: sid, date: { $gte: monthStart } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
          present: { $sum: '$summary.present' },
          absent: { $sum: '$summary.absent' },
          total: { $sum: '$summary.total' },
        },
      },
      { $sort: { _id: 1 } },
    ]),

    // 10. Today's class-by-class attendance aggregate
    Attendance.aggregate([
      { $match: { schoolId: sid, date: todayFilter } },
      {
        $group: {
          _id: '$schoolClass',
          present: { $sum: '$summary.present' },
          total: { $sum: '$summary.total' },
        },
      },
      {
        $lookup: {
          from: 'schoolclasses',
          localField: '_id',
          foreignField: '_id',
          as: 'classInfo',
        },
      },
      { $unwind: { path: '$classInfo', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          className: { $ifNull: ['$classInfo.name', 'Unknown Class'] },
          present: 1,
          total: 1,
        },
      },
      { $sort: { className: 1 } },
    ]),

    // 11-13. Class attendance per period
    getClassAttendanceForPeriod(startOfToday, endOfToday),
    getClassAttendanceForPeriod(weekStart),
    getClassAttendanceForPeriod(monthStart),

    // 14. Today's timetable
    Timetable.find({ schoolId: sid })
      .populate('schoolClass', 'name')
      .populate('section', 'name')
      .populate({
        path: 'periods.subject',
        select: 'name',
      })
      .populate({
        path: 'periods.teacher',
        select: 'firstName lastName',
      })
      .select('periods schoolClass section'),

    // 15. Timetable conflict count
    Timetable.aggregate([
      {
        $match: {
          schoolId: sid,
          'generationLog.severity': 'error',
        },
      },
      {
        $project: {
          conflictCount: {
            $size: {
              $filter: {
                input: { $ifNull: ['$generationLog', []] },
                as: 'log',
                cond: { $eq: ['$$log.severity', 'error'] },
              },
            },
          },
        },
      },
      { $group: { _id: null, total: { $sum: '$conflictCount' } } },
    ]),

    // 16. Students with attendance below 75% (in last 30 days)
    Attendance.aggregate([
      {
        $match: {
          schoolId: sid,
          date: { $gte: monthStart },
        },
      },
      { $unwind: '$students' },
      {
        $group: {
          _id: '$students.student',
          present: {
            $sum: { $cond: [{ $eq: ['$students.status', 'present'] }, 1, 0] },
          },
          total: { $sum: 1 },
        },
      },
      {
        $match: {
          $expr: {
            $lt: [{ $divide: ['$present', { $max: ['$total', 1] }] }, 0.75],
          },
        },
      },
      { $count: 'count' },
    ]),

    // 17. Recent audit logs
    AuditLog.find({ schoolId: sid })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('actor', 'name role')
      .select('actor action entity createdAt'),

    // 18. Upcoming events
    CalendarEvent.find({ schoolId: sid, startDate: { $gte: new Date() } })
      .sort('startDate')
      .limit(3),

    // 19. New admissions this month
    Admission.countDocuments({
      schoolId: sid,
      workflowStatus: 'enrolled',
      createdAt: {
        $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
      },
    }),
  ]);

  // ── Process today's attendance summary ──
  const todaySummary = todayAttendanceDocs.reduce(
    (acc, doc) => {
      acc.present += doc.summary?.present || 0;
      acc.absent += doc.summary?.absent || 0;
      acc.total += doc.summary?.total || 0;
      return acc;
    },
    { present: 0, absent: 0, total: 0 }
  );
  const todayPercentage =
    todaySummary.total > 0
      ? Math.round((todaySummary.present / todaySummary.total) * 1000) / 10
      : null;

  // ── Process fee aggregation ──
  const feeData = feeAgg[0] || { totalBilled: 0, totalPaid: 0, totalPending: 0, pendingStudents: [] };
  const pendingFeeStudents = feeData.pendingStudents?.filter(Boolean).length || 0;

  // ── Process weekly attendance trend ──
  const weeklyTrendMap = {};
  weeklyAttendanceAgg.forEach((r) => { weeklyTrendMap[r._id] = r; });

  const weeklyTrend = last7.map((d) => {
    const dateStr = d.toISOString().split('T')[0];
    const record = weeklyTrendMap[dateStr];
    const dayLabel = DAY_LABELS[d.getDay()];
    const percentage =
      record && record.total > 0
        ? Math.round((record.present / record.total) * 1000) / 10
        : null;
    return { day: dayLabel, date: dateStr, attendance: percentage, hasData: !!record };
  });

  // ── Process monthly attendance trend ──
  const monthlyTrendMap = {};
  monthlyAttendanceAgg.forEach((r) => { monthlyTrendMap[r._id] = r; });

  const monthlyTrend = last30.map((d) => {
    const dateStr = d.toISOString().split('T')[0];
    const record = monthlyTrendMap[dateStr];
    const dayLabel = d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
    const percentage =
      record && record.total > 0
        ? Math.round((record.present / record.total) * 1000) / 10
        : null;
    return { day: dayLabel, date: dateStr, attendance: percentage, hasData: !!record };
  });

  // ── Process today's class trend for attendance overview ──
  const todayAttMap = {};
  todayClassAttendanceAgg.forEach((r) => {
    if (r._id) todayAttMap[r._id.toString()] = r;
  });

  const todayTrend =
    allClasses.length > 0
      ? allClasses.map((cls) => {
          const rec = todayAttMap[cls._id.toString()];
          const pct = rec && rec.total > 0 ? Math.round((rec.present / rec.total) * 1000) / 10 : null;
          return {
            day: cls.name,
            attendance: pct,
            hasData: !!rec,
            present: rec?.present || 0,
            total: rec?.total || 0,
          };
        })
      : todayClassAttendanceAgg.map((c) => ({
          day: c.className,
          attendance: c.total > 0 ? Math.round((c.present / c.total) * 1000) / 10 : null,
          hasData: c.total > 0,
          present: c.present || 0,
          total: c.total || 0,
        }));

  // ── Process class attendance per period ──
  const formatClassAttList = (list) =>
    list.map((c) => ({
      class: c.class,
      percentage: Math.round(c.percentage * 10) / 10,
      present: c.present,
      total: c.total,
    }));

  const classAttendanceToday = formatClassAttList(classAttToday);
  const classAttendanceWeek = formatClassAttList(classAttWeek);
  const classAttendanceMonth = formatClassAttList(classAttMonth);

  // ── Process today's schedule ──
  const getPeriodsForDay = (dayNum) => {
    const list = [];
    timetables.forEach((tt) => {
      const periods = (tt.periods || []).filter((p) => Number(p.day) === Number(dayNum));
      periods.forEach((p) => {
        const teacherObj = p.teacher;
        const teacherName = teacherObj
          ? `${teacherObj.firstName || ''} ${teacherObj.lastName || ''}`.trim()
          : null;
        list.push({
          periodNo: p.periodNo || 1,
          startTime: p.startTime || '',
          endTime: p.endTime || '',
          subject: p.subject?.name || p.label || (p.isLunch ? 'Lunch Break' : p.isBreak ? 'Break' : p.isAssembly ? 'Morning Assembly' : 'Period'),
          className: tt.schoolClass?.name || '',
          section: tt.section?.name || '',
          teacher: teacherName,
          room: p.room || null,
          isLunch: p.isLunch,
          isBreak: p.isBreak,
          isAssembly: p.isAssembly,
        });
      });
    });
    list.sort((a, b) => (a.periodNo || 0) - (b.periodNo || 0) || (a.startTime || '').localeCompare(b.startTime || ''));
    return list;
  };

  let todayPeriods = getPeriodsForDay(now.getDay());

  // Fallback to candidate working day if today has 0 scheduled periods
  if (todayPeriods.length === 0) {
    for (let dayCandidate = 1; dayCandidate <= 6; dayCandidate++) {
      const candidatePeriods = getPeriodsForDay(dayCandidate);
      if (candidatePeriods.length > 0) {
        todayPeriods = candidatePeriods;
        break;
      }
    }
  }

  const timetableConflicts = timetableConflictAgg[0]?.total || 0;
  const lowAttendance = lowAttendanceCount[0]?.count || 0;

  return {
    studentCount,
    teacherCount,
    todayAttendance: {
      ...todaySummary,
      percentage: todayPercentage,
      hasData: todayAttendanceDocs.length > 0,
    },
    feeStats: {
      totalBilled: feeData.totalBilled,
      totalPaid: feeData.totalPaid,
      totalPending: feeData.totalPending,
      pendingStudents: pendingFeeStudents,
      collectionPercent:
        feeData.totalBilled > 0
          ? Math.round((feeData.totalPaid / feeData.totalBilled) * 100)
          : 0,
    },
    admissionApplications,
    pendingLeaves,
    teachersOnLeave,
    lowAttendanceCount: lowAttendance,
    timetableConflicts,
    weeklyAttendanceTrend: weeklyTrend,
    attendanceOverview: {
      today: todayTrend,
      week: weeklyTrend,
      month: monthlyTrend,
    },
    classAttendance: classAttendanceWeek,
    classAttendanceOverview: {
      today: classAttendanceToday,
      week: classAttendanceWeek,
      month: classAttendanceMonth,
    },
    todaySchedule: todayPeriods,
    recentActivity: recentAuditLogs,
    upcomingEvents,
    newAdmissionsThisMonth,
  };
};

// ── Teacher Dashboard ─────────────────────────────────────────────────────────

export const getTeacherDashboard = async (teacherId, schoolId) => {
  const sid = new mongoose.Types.ObjectId(schoolId);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayDayOfWeek = today.getDay();

  // Find teacher doc via User.profileId (User.profileModel = 'Teacher')
  const userDoc = await User.findById(teacherId).select('profileId profileModel').lean();
  const teacherDocId = userDoc?.profileModel === 'Teacher' ? userDoc?.profileId : null;

  const [
    todayTimetable,
    pendingHomework,
    upcomingExams,
    syllabusProgress,
    recognitionActivity,
    pendingLeaveRequests,
    todayAttendanceMarked,
  ] = await Promise.all([
    // Today's timetable periods for this teacher
    teacherDocId
      ? Timetable.find({ schoolId: sid, 'periods.teacher': teacherDocId })
          .populate('schoolClass', 'name')
          .populate('section', 'name')
          .populate('periods.subject', 'name')
          .populate('periods.teacher', 'firstName lastName')
          .select('periods schoolClass section')
      : Promise.resolve([]),

    // Pending homework assigned by teacher
    teacherDocId
      ? Homework.countDocuments({ schoolId: sid, teacher: teacherDocId })
      : Promise.resolve(0),

    // Upcoming exams
    Exam.find({ schoolId: sid, status: 'upcoming' }).sort('startDate').limit(5).select('name startDate endDate status type'),

    // Syllabus progress for classes where teacher is creator
    teacherDocId
      ? Syllabus.find({ schoolId: sid, createdBy: teacherDocId }).select('totalCompletion subject').populate('subject', 'name')
      : Promise.resolve([]),

    // Recognition points awarded by teacher
    teacherDocId
      ? RecognitionPoint.countDocuments({ schoolId: sid, awardedBy: teacherDocId })
      : Promise.resolve(0),

    // Pending leave requests from this teacher (by user id)
    Leave.countDocuments({ schoolId: sid, requester: teacherId, status: 'pending' }),

    // Classes where attendance was already marked today
    Attendance.distinct('schoolClass', { schoolId: sid, date: today, markedBy: teacherId }),
  ]);

  // Extract today's periods for this teacher
  const getTeacherPeriodsForDay = (dayNum) => {
    const list = [];
    if (teacherDocId) {
      todayTimetable.forEach((tt) => {
        const periods = (tt.periods || []).filter((p) => {
          if (Number(p.day) !== Number(dayNum)) return false;
          const tId = p.teacher?._id || p.teacher;
          return tId?.toString() === teacherDocId.toString();
        });
        periods.forEach((p) => {
          list.push({
            periodNo: p.periodNo || 1,
            startTime: p.startTime || '',
            endTime: p.endTime || '',
            subject: p.subject?.name || p.label || 'Period',
            className: tt.schoolClass?.name || '',
            section: tt.section?.name || '',
            room: p.room || null,
            attendanceMarked: todayAttendanceMarked.some(
              (cid) => cid.toString() === tt.schoolClass?._id?.toString()
            ),
          });
        });
      });
      list.sort((a, b) => (a.periodNo || 0) - (b.periodNo || 0) || (a.startTime || '').localeCompare(b.startTime || ''));
    }
    return list;
  };

  let todayClasses = getTeacherPeriodsForDay(todayDayOfWeek);
  if (todayClasses.length === 0) {
    for (let d = 1; d <= 6; d++) {
      const cand = getTeacherPeriodsForDay(d);
      if (cand.length > 0) {
        todayClasses = cand;
        break;
      }
    }
  }

  const pendingAttendanceCount = todayClasses.filter((c) => !c.attendanceMarked).length;

  return {
    todayClasses,
    todayClassesCount: todayClasses.length,
    pendingAttendance: pendingAttendanceCount,
    pendingHomework,
    upcomingExams,
    syllabusProgress,
    recognitionActivity,
    pendingLeaveRequests,
  };
};

// ── Student Dashboard ─────────────────────────────────────────────────────────

export const getStudentDashboard = async (userId, schoolId) => {
  const sid = new mongoose.Types.ObjectId(schoolId);

  // Find student doc via User.profileId (User.profileModel = 'Student')
  const userDoc = await User.findById(userId).select('profileId profileModel').lean();
  const studentId = userDoc?.profileModel === 'Student' ? userDoc?.profileId : null;

  if (!studentId) {
    return { attendance: null, homework: [], fees: [], results: [], notices: [], recognition: 0, timetable: null, events: [] };
  }

  const studentDoc = await Student.findById(studentId).select('currentClass').lean();
  const classId = studentDoc?.currentClass;

  // Last 30 days attendance
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [
    attendanceDocs,
    homework,
    fees,
    results,
    notices,
    recognitionCount,
    timetable,
    events,
  ] = await Promise.all([
    Attendance.find({ schoolId: sid, 'students.student': studentId, date: { $gte: thirtyDaysAgo } })
      .sort('-date')
      .select('date students'),

    classId
      ? Homework.find({ schoolId: sid, schoolClass: classId }).sort('-createdAt').limit(5).select('title subject dueDate submissions')
      : Promise.resolve([]),

    FeeTransaction.find({ schoolId: sid, student: studentId })
      .select('amount paidAmount balance status dueDate paymentDate receiptNo'),

    Exam.find({ schoolId: sid, status: { $in: ['upcoming', 'published'] } })
      .sort('startDate')
      .limit(5)
      .select('name startDate endDate status type'),

    Notice.find({ schoolId: sid, status: 'published' })
      .sort('-createdAt')
      .limit(5)
      .select('title content createdAt'),

    RecognitionPoint.countDocuments({ schoolId: sid, student: studentId }),

    classId
      ? Timetable.findOne({ schoolId: sid, schoolClass: classId })
          .populate('periods.subject', 'name')
          .populate('periods.teacher', 'firstName lastName')
          .select('periods')
      : Promise.resolve(null),

    CalendarEvent.find({ schoolId: sid, startDate: { $gte: new Date() } })
      .sort('startDate')
      .limit(5)
      .select('title startDate endDate type'),
  ]);

  // Summarize attendance
  let presentCount = 0;
  let totalCount = 0;
  attendanceDocs.forEach((doc) => {
    const studentEntry = doc.students?.find(
      (s) => s.student?.toString() === studentId.toString()
    );
    if (studentEntry) {
      totalCount++;
      if (studentEntry.status === 'present' || studentEntry.status === 'late') {
        presentCount++;
      }
    }
  });
  const attendancePercentage =
    totalCount > 0 ? Math.round((presentCount / totalCount) * 1000) / 10 : null;

  // Fee summary
  const totalFees = fees.reduce((s, f) => s + (f.amount || 0), 0);
  const paidFees = fees.reduce((s, f) => s + (f.paidAmount || 0), 0);
  const pendingFees = fees.reduce((s, f) => s + (f.balance || 0), 0);
  const overdueFees = fees.filter((f) => f.status === 'overdue').length;

  return {
    attendance: {
      present: presentCount,
      total: totalCount,
      percentage: attendancePercentage,
      recentDays: attendanceDocs.slice(0, 10).map((doc) => {
        const entry = doc.students?.find((s) => s.student?.toString() === studentId.toString());
        return { date: doc.date, status: entry?.status || 'unknown' };
      }),
    },
    homework: homework.map((h) => {
      const submission = h.submissions?.find(
        (s) => s.student?.toString() === studentId.toString()
      );
      return {
        id: h._id,
        title: h.title,
        dueDate: h.dueDate,
        submittedAt: submission?.submittedAt || null,
        submissionStatus: submission?.status || null,
      };
    }),
    fees: {
      total: totalFees,
      paid: paidFees,
      pending: pendingFees,
      overdue: overdueFees,
      transactions: fees.length,
    },
    results,
    notices,
    recognition: recognitionCount,
    timetable,
    events,
  };
};

// ── Parent Dashboard ──────────────────────────────────────────────────────────

export const getParentDashboard = async (parentId, schoolId) => {
  // Parent dashboard: aggregate across all linked children
  return { /* parent multi-child data aggregated */ };
};
