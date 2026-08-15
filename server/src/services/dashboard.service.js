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

export const getSchoolAdminDashboard = async (schoolId) => {
  const [studentCount, teacherCount, todayAttendance, pendingFees, recentNotices, admissionApplications, pendingLeaves, upcomingEvents] = await Promise.all([
    Student.countDocuments({ schoolId, status: 'active' }),
    Teacher.countDocuments({ schoolId, status: 'active' }),
    Attendance.findOne({ schoolId, date: new Date().toISOString().split('T')[0] }),
    FeeTransaction.countDocuments({ schoolId, status: { $in: ['pending', 'overdue'] } }),
    Notice.find({ schoolId, status: 'published' }).sort('-createdAt').limit(5),
    Admission.countDocuments({ schoolId, workflowStatus: { $in: ['submitted', 'document_upload', 'verification'] } }),
    Leave.countDocuments({ schoolId, status: 'pending' }),
    CalendarEvent.find({ schoolId, startDate: { $gte: new Date() } }).sort('startDate').limit(5),
  ]);

  return {
    studentCount,
    teacherCount,
    todayAttendance: todayAttendance?.summary || { present: 0, absent: 0, total: 0 },
    pendingFees,
    recentNotices,
    admissionApplications,
    pendingLeaves,
    upcomingEvents,
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
