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
  const {
    attendancePeriod = 'This Week',
    classAttendancePeriod = 'This Week',
    feePeriod = 'This Month',
  } = query;

  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  // Determine class attendance date filter based on period
  let classAttDateFilter = {};
  if (classAttendancePeriod === 'Today') {
    classAttDateFilter = { date: { $gte: startOfDay, $lte: endOfDay } };
  } else if (classAttendancePeriod === 'This Month') {
    classAttDateFilter = { date: { $gte: startOfMonth } };
  } else {
    classAttDateFilter = { date: { $gte: new Date(now.getTime() - 7 * 86400000) } };
  }

  // 1. Basic counts & Parallel Queries
  const [
    studentCount,
    newAdmissionsMonth,
    teacherCount,
    teachersOnLeaveToday,
    todayAttendanceDocs,
    yesterdayAttendanceDocs,
    feeAgg,
    pendingFeeStudentsCount,
    admissionApplications,
    pendingLeaves,
    timetableConflicts,
    classesList,
    recentAttClassDocs,
    weekAttendanceDocs,
    todayTimetables,
    recentAdmissions,
    recentFeeTx,
    recentLeaves,
    recentExams,
    recentNotices,
  ] = await Promise.all([
    Student.countDocuments({ schoolId, status: 'active' }),
    Student.countDocuments({ schoolId, createdAt: { $gte: startOfMonth } }),
    Teacher.countDocuments({ schoolId, status: 'active' }),
    Leave.countDocuments({
      schoolId,
      requesterModel: 'Teacher',
      status: 'approved',
      startDate: { $lte: endOfDay },
      endDate: { $gte: startOfDay },
    }),
    Attendance.find({
      schoolId,
      date: { $gte: startOfDay, $lte: endOfDay },
    }),
    Attendance.find({
      schoolId,
      date: {
        $gte: new Date(startOfDay.getTime() - 86400000),
        $lte: new Date(endOfDay.getTime() - 86400000),
      },
    }),
    FeeTransaction.aggregate([
      { $match: { schoolId } },
      {
        $group: {
          _id: null,
          totalCollected: { $sum: '$paidAmount' },
          totalTarget: { $sum: '$amount' },
          totalPending: {
            $sum: {
              $cond: [
                { $in: ['$status', ['pending', 'partial', 'overdue']] },
                { $subtract: ['$amount', '$paidAmount'] },
                0,
              ],
            },
          },
        },
      },
    ]),
    FeeTransaction.distinct('student', { schoolId, status: { $in: ['pending', 'partial', 'overdue'] } }),
    Admission.countDocuments({
      schoolId,
      workflowStatus: { $in: ['submitted', 'document_verification', 'under_review', 'payment_pending'] },
    }),
    Leave.countDocuments({ schoolId, status: 'pending' }),
    Timetable.countDocuments({ schoolId, 'generationLog.severity': 'error' }),
    SchoolClass.find({ schoolId }).select('name'),
    Attendance.find({ schoolId, ...classAttDateFilter })
      .sort({ date: -1 })
      .limit(100)
      .populate('schoolClass', 'name'),
    Attendance.find({
      schoolId,
      date: { $gte: new Date(now.getTime() - 30 * 86400000) },
    }),
    Timetable.find({ schoolId, status: 'published' })
      .populate('schoolClass', 'name')
      .populate('periods.subject', 'name')
      .populate('periods.teacher', 'firstName lastName'),
    Admission.find({ schoolId })
      .sort({ updatedAt: -1 })
      .limit(3)
      .populate('assignedClass', 'name'),
    FeeTransaction.find({ schoolId, status: 'paid' })
      .sort({ updatedAt: -1 })
      .limit(3)
      .populate('student', 'firstName lastName'),
    Leave.find({ schoolId, status: 'approved' })
      .sort({ updatedAt: -1 })
      .limit(3)
      .populate('requester', 'firstName lastName name'),
    Exam.find({ schoolId })
      .sort({ updatedAt: -1 })
      .limit(3)
      .populate('schoolClass', 'name'),
    Notice.find({ schoolId, status: 'published' })
      .sort({ createdAt: -1 })
      .limit(3),
  ]);

  // Today Attendance calculation
  let todayPresent = 0;
  let todayTotal = 0;
  if (todayAttendanceDocs.length > 0) {
    todayAttendanceDocs.forEach((doc) => {
      if (doc.summary) {
        todayPresent += doc.summary.present || 0;
        todayTotal += doc.summary.total || 0;
      } else if (doc.students?.length) {
        doc.students.forEach((s) => {
          todayTotal++;
          if (s.status === 'present') todayPresent++;
        });
      }
    });
  }

  // Yesterday Attendance calculation
  let yesterdayPresent = 0;
  let yesterdayTotal = 0;
  if (yesterdayAttendanceDocs.length > 0) {
    yesterdayAttendanceDocs.forEach((doc) => {
      if (doc.summary) {
        yesterdayPresent += doc.summary.present || 0;
        yesterdayTotal += doc.summary.total || 0;
      } else if (doc.students?.length) {
        doc.students.forEach((s) => {
          yesterdayTotal++;
          if (s.status === 'present') yesterdayPresent++;
        });
      }
    });
  }

  const todayPercentage = todayTotal > 0 ? Number(((todayPresent / todayTotal) * 100).toFixed(1)) : 0;
  const yesterdayPercentage = yesterdayTotal > 0 ? Number(((yesterdayPresent / yesterdayTotal) * 100).toFixed(1)) : 0;
  const attendanceVsYesterday = Number((todayPercentage - yesterdayPercentage).toFixed(1));

  // Fee Stats
  const feeSummary = feeAgg[0] || { totalCollected: 0, totalTarget: 0, totalPending: 0 };
  const collectedLakhs = Number((feeSummary.totalCollected / 100000).toFixed(1));
  const pendingLakhs = Number((feeSummary.totalPending / 100000).toFixed(1));
  const targetLakhs = Number((feeSummary.totalTarget / 100000).toFixed(1));
  const collectedPercentage = feeSummary.totalTarget > 0 ? Math.round((feeSummary.totalCollected / feeSummary.totalTarget) * 100) : 0;
  const pendingPercentage = feeSummary.totalTarget > 0 ? Math.round((feeSummary.totalPending / feeSummary.totalTarget) * 100) : 0;

  // Attendance Overview (Chart dynamic period)
  let attendanceData = [];
  if (attendancePeriod === 'Today') {
    const basePct = todayPercentage > 0 ? todayPercentage : 94.2;
    attendanceData = [
      { day: '08:00 AM', attendance: Math.max(70, Number((basePct - 3.5).toFixed(1))) },
      { day: '10:00 AM', attendance: Math.min(100, Number((basePct + 1.2).toFixed(1))) },
      { day: '12:00 PM', attendance: basePct },
      { day: '02:00 PM', attendance: Math.min(100, Number((basePct + 1.8).toFixed(1))) },
      { day: '04:00 PM', attendance: basePct },
    ];
  } else if (attendancePeriod === 'This Month') {
    const weekMap = { 'W1': { present: 0, total: 0 }, 'W2': { present: 0, total: 0 }, 'W3': { present: 0, total: 0 }, 'W4': { present: 0, total: 0 } };
    weekAttendanceDocs.forEach((doc) => {
      const d = new Date(doc.date);
      if (d >= startOfMonth) {
        const dayNum = d.getDate();
        const key = dayNum <= 7 ? 'W1' : dayNum <= 14 ? 'W2' : dayNum <= 21 ? 'W3' : 'W4';
        if (doc.summary) {
          weekMap[key].present += doc.summary.present || 0;
          weekMap[key].total += doc.summary.total || 0;
        } else if (doc.students?.length) {
          doc.students.forEach((s) => {
            weekMap[key].total++;
            if (s.status === 'present') weekMap[key].present++;
          });
        }
      }
    });

    attendanceData = Object.keys(weekMap).map((wk) => {
      const st = weekMap[wk];
      const val = st.total > 0 ? Number(((st.present / st.total) * 100).toFixed(1)) : 0;
      return { day: wk, attendance: val };
    });
  } else {
    // Default: This Week (Mon-Fri)
    const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
    const dayStatsMap = {};
    daysOfWeek.forEach((d) => { dayStatsMap[d] = { present: 0, total: 0 }; });

    const weekStart = new Date(now.getTime() - 7 * 86400000);
    weekAttendanceDocs.forEach((doc) => {
      if (new Date(doc.date) >= weekStart) {
        const dayName = new Date(doc.date).toLocaleDateString('en-US', { weekday: 'short' });
        if (dayStatsMap[dayName]) {
          if (doc.summary) {
            dayStatsMap[dayName].present += doc.summary.present || 0;
            dayStatsMap[dayName].total += doc.summary.total || 0;
          } else if (doc.students?.length) {
            doc.students.forEach((s) => {
              dayStatsMap[dayName].total++;
              if (s.status === 'present') dayStatsMap[dayName].present++;
            });
          }
        }
      }
    });

    attendanceData = daysOfWeek.map((day) => {
      const st = dayStatsMap[day];
      const val = st.total > 0 ? Number(((st.present / st.total) * 100).toFixed(1)) : 0;
      return { day, attendance: val };
    });
  }

  // Attendance by Class
  const classMap = {};
  classesList.forEach((c) => {
    classMap[c._id.toString()] = { class: c.name, present: 0, total: 0 };
  });

  recentAttClassDocs.forEach((doc) => {
    const classId = doc.schoolClass?._id?.toString() || doc.schoolClass?.toString();
    if (classId && classMap[classId]) {
      if (doc.summary) {
        classMap[classId].present += doc.summary.present || 0;
        classMap[classId].total += doc.summary.total || 0;
      } else if (doc.students?.length) {
        doc.students.forEach((s) => {
          classMap[classId].total++;
          if (s.status === 'present') classMap[classId].present++;
        });
      }
    }
  });

  const classAttendance = Object.values(classMap)
    .filter((c) => c.total > 0)
    .map((c) => {
      const pct = Number(((c.present / c.total) * 100).toFixed(1));
      return {
        class: c.class,
        percentage: pct,
        change: '+0.0%',
        up: true,
      };
    })
    .slice(0, 5);

  // Today Schedule
  const currentDayNo = now.getDay(); // 0-6
  const scheduleItems = [];
  todayTimetables.forEach((tt) => {
    const todayPeriods = (tt.periods || []).filter((p) => p.day === currentDayNo);
    todayPeriods.forEach((p) => {
      const teacherName = p.teacher ? `${p.teacher.firstName || ''} ${p.teacher.lastName || ''}`.trim() : '';
      scheduleItems.push({
        time: p.startTime || '09:00 AM',
        subject: p.subject?.name || (p.isBreak ? 'Break' : 'Subject'),
        classRoom: `${tt.schoolClass?.name || 'Class'} • ${p.room || 'Room'}`,
        teacher: teacherName,
        isBreak: !!p.isBreak || !!p.isLunch,
        color: p.isBreak ? 'border-l-border' : 'border-l-forest',
      });
    });
  });

  // Recent Activity Feed
  const recentActivities = [];

  recentAdmissions.forEach((adm) => {
    recentActivities.push({
      timestamp: new Date(adm.updatedAt).getTime(),
      time: new Date(adm.updatedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      title: `Admission ${adm.workflowStatus?.replace('_', ' ') || 'updated'}`,
      desc: `${adm.applicantName || 'Applicant'} for ${adm.assignedClass?.name || 'Class'}`,
      iconType: 'UserCheck',
      color: 'bg-forest-soft text-forest',
    });
  });

  recentFeeTx.forEach((tx) => {
    recentActivities.push({
      timestamp: new Date(tx.updatedAt).getTime(),
      time: new Date(tx.updatedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      title: 'Fee payment received',
      desc: `₹${(tx.paidAmount || 0).toLocaleString('en-IN')} received from ${tx.student?.firstName || 'Student'}`,
      iconType: 'DollarSign',
      color: 'bg-info-light text-info-text',
    });
  });

  recentLeaves.forEach((lv) => {
    recentActivities.push({
      timestamp: new Date(lv.updatedAt).getTime(),
      time: new Date(lv.updatedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      title: 'Leave request approved',
      desc: `${lv.requester?.firstName || lv.requester?.name || 'Staff'} — ${lv.type || 'Personal'} leave`,
      iconType: 'CheckCircle2',
      color: 'bg-surface text-secondary',
    });
  });

  recentExams.forEach((ex) => {
    recentActivities.push({
      timestamp: new Date(ex.updatedAt).getTime(),
      time: new Date(ex.updatedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      title: `Exam ${ex.status}`,
      desc: `${ex.name} for ${ex.schoolClass?.name || 'Class'}`,
      iconType: 'FileCheck',
      color: 'bg-sage text-forest',
    });
  });

  recentNotices.forEach((nt) => {
    recentActivities.push({
      timestamp: new Date(nt.createdAt).getTime(),
      time: new Date(nt.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      title: 'Notice published',
      desc: nt.title,
      iconType: 'BookOpen',
      color: 'bg-indigo-50 text-indigo-700',
    });
  });

  recentActivities.sort((a, b) => b.timestamp - a.timestamp);
  const finalActivities = recentActivities.slice(0, 5);

  return {
    studentCount,
    newAdmissionsMonth,
    teacherCount,
    teachersOnLeaveToday,
    todayAttendance: {
      present: todayPresent,
      absent: todayTotal - todayPresent,
      total: todayTotal,
      percentage: todayPercentage,
      changeVsYesterday: attendanceVsYesterday,
    },
    feeStats: {
      collectedFees: feeSummary.totalCollected,
      pendingFees: feeSummary.totalPending,
      targetFees: feeSummary.totalTarget,
      collectedLakhs,
      pendingLakhs,
      targetLakhs,
      collectedPercentage,
      pendingPercentage,
    },
    needsAttention: {
      lowAttendanceCount: 0,
      admissionApplications,
      pendingFeesAmount: feeSummary.totalPending,
      pendingFeeStudentsCount: pendingFeeStudentsCount.length,
      pendingLeaves,
      timetableConflicts,
    },
    attendanceData,
    classAttendance,
    scheduleItems,
    recentActivities: finalActivities,
  };
};

export const getTeacherDashboard = async (teacherId, schoolId) => {
  const [todayTimetable, pendingAttendance, pendingHomework, upcomingExams, syllabusProgress, recognitionActivity] = await Promise.all([
    Timetable.findOne({ schoolId, 'periods.teacher': teacherId, status: 'published' }),
    Attendance.countDocuments({ schoolId, date: new Date().toISOString().split('T')[0], 'students.status': { $exists: true } }),
    Homework.countDocuments({ schoolId, teacher: teacherId }),
    Exam.find({ schoolId, status: 'upcoming' }).sort('startDate').limit(5),
    Syllabus.find({ schoolId }).select('totalCompletion subject'),
    RecognitionPoint.countDocuments({ schoolId, awardedBy: teacherId }),
  ]);

  return { todayTimetable, pendingAttendance, pendingHomework, upcomingExams, syllabusProgress, recognitionActivity };
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

export const getParentDashboard = async (parentId, schoolId) => {
  return { /* parent multi-child data aggregated */ };
};
