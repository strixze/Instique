import crypto from 'crypto';
import Student from '../models/Student.js';
import Parent from '../models/Parent.js';
import { User } from '../models/User.js';
import School from '../models/School.js';
import AccountToken from '../models/AccountToken.js';
import AuditLog from '../models/AuditLog.js';
import Section from '../models/Section.js';
import Attendance from '../models/Attendance.js';
import Exam from '../models/Exam.js';
import Mark from '../models/Mark.js';
import FeeTransaction from '../models/FeeTransaction.js';
import Homework from '../models/Homework.js';
import RecognitionPoint from '../models/RecognitionPoint.js';
import Badge from '../models/Badge.js';
import Setting from '../models/Setting.js';
import Subject from '../models/Subject.js';
import ApiError from '../utils/ApiError.js';
import env from '../config/env.js';
import { paginate } from '../utils/pagination.js';
import { sendEmail } from './brevoMail.service.js';
import { getPasswordResetEmailTemplate } from './emailTemplates/passwordReset.template.js';

export const createStudent = async (schoolId, data) => {
  const existing = await Student.findOne({ schoolId, admissionNo: data.admissionNo });
  if (existing) throw new ApiError(409, 'Admission number already exists');

  let sectionId = data.currentSection;
  if (!sectionId && data.currentClass) {
    const sections = await Section.find({ schoolClass: data.currentClass });
    if (sections.length > 0) {
      const studentCounts = await Promise.all(
        sections.map(async (sec) => {
          const count = await Student.countDocuments({ schoolId, currentSection: sec._id });
          return { id: sec._id, count };
        })
      );
      studentCounts.sort((a, b) => a.count - b.count);
      sectionId = studentCounts[0].id;
    }
  }

  const student = await Student.create({
    ...data,
    currentSection: sectionId || undefined,
    schoolId,
    feeStructure: data.feeStructure || undefined,
    installments: data.installments || [100],
  });
  return student;
};

export const getStudents = async (schoolId, options) => {
  const { status, currentClass, gender, ...rest } = options;
  const filter = {};
  if (status) filter.status = status;
  if (currentClass) filter.currentClass = currentClass;
  if (gender) filter.gender = gender;

  const result = await paginate(Student, { schoolId }, {
    ...rest,
    searchFields: ['firstName', 'lastName', 'admissionNo'],
    filter,
    populate: [
      { path: 'currentClass', select: 'name' },
      { path: 'currentSection', select: 'name' },
      { path: 'parents', select: 'firstName lastName relation contact isPrimary' },
    ],
  });

  // Attach real User account statuses for linked parents
  if (result.data && result.data.length > 0) {
    const parentEmails = [];
    const parentProfileIds = [];

    result.data.forEach((s) => {
      (s.parents || []).forEach((p) => {
        if (p._id) parentProfileIds.push(p._id);
        if (p.contact?.email) parentEmails.push(p.contact.email.toLowerCase().trim());
      });
    });

    const parentUsers = await User.find({
      schoolId,
      role: 'parent',
      $or: [
        { profileId: { $in: parentProfileIds } },
        { email: { $in: parentEmails } },
      ],
    }).select('_id email status isActive profileId');

    const userMapByProfileId = new Map();
    const userMapByEmail = new Map();
    parentUsers.forEach((u) => {
      if (u.profileId) userMapByProfileId.set(u.profileId.toString(), u);
      if (u.email) userMapByEmail.set(u.email.toLowerCase().trim(), u);
    });

    result.data = result.data.map((studentDoc) => {
      const sObj = studentDoc.toObject ? studentDoc.toObject() : { ...studentDoc };
      if (Array.isArray(sObj.parents)) {
        sObj.parents = sObj.parents.map((p) => {
          const userAccount = (p._id && userMapByProfileId.get(p._id.toString()))
            || (p.contact?.email && userMapByEmail.get(p.contact.email.toLowerCase().trim()));

          let accountStatus = 'NOT_LINKED';
          if (userAccount) {
            if (userAccount.status === 'pending_activation') {
              accountStatus = 'PENDING_ACTIVATION';
            } else if (userAccount.status === 'suspended' || userAccount.status === 'inactive' || !userAccount.isActive) {
              accountStatus = 'SUSPENDED';
            } else if (userAccount.status === 'active') {
              accountStatus = 'ACTIVE';
            } else {
              accountStatus = (userAccount.status || 'ACTIVE').toUpperCase();
            }
          }

          return {
            ...p,
            userAccountId: userAccount?._id || null,
            accountStatus,
          };
        });
      }
      return sObj;
    });
  }

  return result;
};

export const getStudentById = async (id, schoolId) => {
  const student = await Student.findOne({ _id: id, schoolId })
    .populate('currentClass', 'name')
    .populate('currentSection', 'name')
    .populate('parents', 'firstName lastName relation contact isPrimary')
    .populate('academicYear', 'name');
  if (!student) throw new ApiError(404, 'Student not found');
  return student;
};

export const updateStudent = async (id, schoolId, data) => {
  const student = await Student.findOneAndUpdate({ _id: id, schoolId }, data, { new: true, runValidators: true });
  if (!student) throw new ApiError(404, 'Student not found');
  return student;
};

export const deleteStudent = async (id, schoolId) => {
  const student = await Student.findOneAndDelete({ _id: id, schoolId });
  if (!student) throw new ApiError(404, 'Student not found');
  return true;
};

export const bulkCreateStudents = async (schoolId, students) => {
  const results = { created: [], errors: [] };
  for (const data of students) {
    try {
      let sectionId = data.currentSection;
      if (!sectionId && data.currentClass) {
        const sections = await Section.find({ schoolClass: data.currentClass });
        if (sections.length > 0) {
          const studentCounts = await Promise.all(
            sections.map(async (sec) => {
              const count = await Student.countDocuments({ schoolId, currentSection: sec._id });
              return { id: sec._id, count };
            })
          );
          studentCounts.sort((a, b) => a.count - b.count);
          sectionId = studentCounts[0].id;
        }
      }

      const student = await Student.create({
        ...data,
        currentSection: sectionId || undefined,
        schoolId,
      });
      results.created.push(student);
    } catch (err) {
      results.errors.push({ data, error: err.message });
    }
  }
  return results;
};

export const promoteStudents = async (schoolId, studentIds, newClassId, newSectionId) => {
  const result = await Student.updateMany(
    { _id: { $in: studentIds }, schoolId },
    {
      $set: { currentClass: newClassId, currentSection: newSectionId },
      $push: { statusHistory: { from: 'active', to: 'promoted' } },
    }
  );
  return result;
};

/**
 * Send parent password reset email from Student Management
 */
export const sendParentPasswordReset = async (studentId, schoolId, parentId, adminUser, ip, userAgent) => {
  // 1. Find the student in the authenticated school
  const student = await Student.findOne({ _id: studentId, schoolId })
    .populate('parents', 'firstName lastName relation contact isPrimary')
    .populate('currentClass', 'name');

  if (!student) {
    throw new ApiError(404, 'Student not found');
  }

  if (!student.parents || student.parents.length === 0) {
    throw new ApiError(400, 'No parent account linked to this student');
  }

  // 2. Identify target parent
  let targetParent = null;
  if (parentId) {
    targetParent = student.parents.find((p) => p._id.toString() === parentId.toString());
    if (!targetParent) {
      throw new ApiError(400, 'Specified parent is not linked to this student');
    }
  } else {
    // Default to primary or first parent
    targetParent = student.parents.find((p) => p.isPrimary) || student.parents[0];
  }

  const parentEmail = targetParent.contact?.email?.toLowerCase().trim();
  if (!parentEmail) {
    throw new ApiError(400, 'Linked parent does not have an email address on file');
  }

  // 3. Find target parent User account
  const parentUser = await User.findOne({
    schoolId,
    role: 'parent',
    $or: [
      { profileId: targetParent._id },
      { email: parentEmail },
    ],
  });

  if (!parentUser) {
    throw new ApiError(400, 'Parent account has not been activated or created yet');
  }

  if (parentUser.status === 'pending_activation') {
    throw new ApiError(400, 'Parent account is pending activation. Please resend the activation email instead.');
  }

  if (parentUser.status === 'suspended' || parentUser.status === 'inactive' || !parentUser.isActive) {
    throw new ApiError(403, 'Parent account is currently suspended or inactive. Password reset is not permitted.');
  }

  // 4. Invalidate previous unused password reset tokens for this parent
  await AccountToken.updateMany(
    { userId: parentUser._id, type: 'password_reset', usedAt: null },
    { usedAt: new Date() }
  );

  // 5. Generate secure random reset token
  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  const resetTokenDoc = await AccountToken.create({
    tokenHash,
    userId: parentUser._id,
    type: 'password_reset',
    expiresAt,
    emailDeliveryStatus: 'pending',
  });

  // 6. Build dynamic reset URL & send Brevo email
  const resetUrl = `${env.CLIENT_URL}/reset-password?token=${rawToken}`;
  const school = await School.findById(schoolId).select('name');
  const schoolName = school?.name || 'Your School';
  const parentName = `${targetParent.firstName} ${targetParent.lastName}`.trim() || parentUser.name;

  const emailHtml = getPasswordResetEmailTemplate({
    userName: parentName,
    resetUrl,
    expiryMinutes: 60,
  });

  const emailResult = await sendEmail(
    parentUser.email,
    `Reset Your Instique Parent Account Password — ${schoolName}`,
    emailHtml,
    parentName
  );

  if (emailResult.success) {
    await AccountToken.findByIdAndUpdate(resetTokenDoc._id, { emailDeliveryStatus: 'sent' });
  } else {
    await AccountToken.findByIdAndUpdate(resetTokenDoc._id, {
      emailDeliveryStatus: 'failed',
      emailDeliveryError: emailResult.error,
    });
    throw new ApiError(500, 'Unable to send password reset email. Please try again later.');
  }

  // 7. Audit Log
  await AuditLog.create({
    schoolId,
    actor: adminUser._id,
    action: 'parent_password_reset_sent',
    entity: 'Parent',
    entityId: targetParent._id,
    before: { studentId: student._id, studentName: `${student.firstName} ${student.lastName}`, parentEmail: parentUser.email },
    ip,
    userAgent,
  });

  return {
    success: true,
    message: `Password reset link sent successfully to ${parentUser.email}`,
    parentName,
    email: parentUser.email,
    studentName: `${student.firstName} ${student.lastName}`,
  };
};

/**
 * Get aggregated student profile for Student Details page
 */
export const getStudentProfile = async (id, schoolId, user) => {
  // 1. School Isolation & Authorization check
  const student = await Student.findOne({ _id: id, schoolId })
    .populate('currentClass', 'name code')
    .populate('currentSection', 'name')
    .populate('parents', 'firstName lastName relation contact isPrimary occupation')
    .populate('academicYear', 'name startDate endDate');

  if (!student) {
    throw new ApiError(404, 'Student not found');
  }

  // Parallelized database aggregation for all student sections
  const [
    attendanceDocs,
    markDocs,
    feeTxDocs,
    homeworkDocs,
    recognitionDocs,
    badgeDocs,
    settingsDoc,
    auditLogs
  ] = await Promise.all([
    // Attendance
    Attendance.find({
      schoolId,
      'students.student': id,
    }).populate('subject', 'name code'),

    // Exam Marks
    Mark.find({
      schoolId,
      student: id,
    }).populate('exam', 'name startDate endDate type status')
      .populate('subject', 'name code'),

    // Fee Transactions
    FeeTransaction.find({
      schoolId,
      student: id,
    }).populate('feeStructure', 'name totalAmount categories'),

    // Homework assigned to student's class/section
    student.currentClass ? Homework.find({
      schoolId,
      schoolClass: student.currentClass._id || student.currentClass,
      status: 'published',
      ...(student.currentSection ? { $or: [{ section: student.currentSection._id || student.currentSection }, { section: null }] } : {}),
    }).populate('subject', 'name code').populate('teacher', 'name') : Promise.resolve([]),

    // Recognition Points
    RecognitionPoint.find({
      schoolId,
      student: id,
    }).populate('awardedBy', 'name email'),

    // Badges
    Badge.find({
      schoolId,
      'awardedTo.student': id,
    }),

    // School Settings
    Setting.findOne({ schoolId }),

    // Audit logs for activity timeline
    AuditLog.find({
      schoolId,
      $or: [
        { entity: 'Student', entityId: id },
        { 'before.studentId': id }
      ]
    }).populate('actor', 'name role').sort({ createdAt: -1 }).limit(20)
  ]);

  // Process Parent User Account status
  let parentDetails = [];
  if (student.parents && student.parents.length > 0) {
    const parentProfileIds = student.parents.map((p) => p._id);
    const parentEmails = student.parents
      .map((p) => p.contact?.email?.toLowerCase().trim())
      .filter(Boolean);

    const parentUsers = await User.find({
      schoolId,
      role: 'parent',
      $or: [
        { profileId: { $in: parentProfileIds } },
        { email: { $in: parentEmails } }
      ]
    }).select('_id email status isActive profileId name phone');

    const userMapByProfileId = new Map();
    const userMapByEmail = new Map();
    parentUsers.forEach((u) => {
      if (u.profileId) userMapByProfileId.set(u.profileId.toString(), u);
      if (u.email) userMapByEmail.set(u.email.toLowerCase().trim(), u);
    });

    parentDetails = student.parents.map((p) => {
      const pObj = p.toObject ? p.toObject() : p;
      const userAccount = (p._id && userMapByProfileId.get(p._id.toString()))
        || (p.contact?.email && userMapByEmail.get(p.contact.email.toLowerCase().trim()));

      let accountStatus = 'NOT_LINKED';
      if (userAccount) {
        if (userAccount.status === 'pending_activation') accountStatus = 'PENDING_ACTIVATION';
        else if (userAccount.status === 'suspended' || !userAccount.isActive) accountStatus = 'SUSPENDED';
        else accountStatus = (userAccount.status || 'ACTIVE').toUpperCase();
      }

      return {
        ...pObj,
        userAccountId: userAccount?._id || null,
        accountStatus,
      };
    });
  }

  // 1. Attendance Analytics
  let attendanceTotalDays = 0;
  let attendancePresentCount = 0;
  let attendanceAbsentCount = 0;
  let attendanceLateCount = 0;
  let attendanceLeaveCount = 0;
  const monthlyAttendanceMap = {};
  const subjectAttendanceMap = {};

  attendanceDocs.forEach((doc) => {
    const studentRecord = (doc.students || []).find(
      (s) => s.student?.toString() === id.toString()
    );
    if (studentRecord) {
      attendanceTotalDays++;
      const st = studentRecord.status;
      if (st === 'present') attendancePresentCount++;
      else if (st === 'absent') attendanceAbsentCount++;
      else if (st === 'late') { attendanceLateCount++; attendancePresentCount++; }
      else if (st === 'leave') attendanceLeaveCount++;

      // Monthly aggregation
      if (doc.date) {
        const monthKey = new Date(doc.date).toLocaleString('default', { month: 'short', year: 'numeric' });
        if (!monthlyAttendanceMap[monthKey]) {
          monthlyAttendanceMap[monthKey] = { month: monthKey, total: 0, present: 0, absent: 0, late: 0, dateObj: new Date(doc.date) };
        }
        monthlyAttendanceMap[monthKey].total++;
        if (st === 'present' || st === 'late') monthlyAttendanceMap[monthKey].present++;
        if (st === 'absent') monthlyAttendanceMap[monthKey].absent++;
        if (st === 'late') monthlyAttendanceMap[monthKey].late++;
      }

      // Subject-wise aggregation if available
      if (doc.subject) {
        const subjName = doc.subject.name || 'General';
        if (!subjectAttendanceMap[subjName]) {
          subjectAttendanceMap[subjName] = { subject: subjName, total: 0, present: 0 };
        }
        subjectAttendanceMap[subjName].total++;
        if (st === 'present' || st === 'late') subjectAttendanceMap[subjName].present++;
      }
    }
  });

  const attendancePercentage = attendanceTotalDays > 0
    ? Math.round(((attendancePresentCount) / attendanceTotalDays) * 1000) / 10
    : null;

  const attendanceThreshold = settingsDoc?.academicSettings?.attendanceThreshold || 75;

  const monthlyAttendanceTrend = Object.values(monthlyAttendanceMap)
    .sort((a, b) => a.dateObj - b.dateObj)
    .map(m => ({
      month: m.month,
      percentage: m.total > 0 ? Math.round((m.present / m.total) * 1000) / 10 : 0,
      present: m.present,
      absent: m.absent,
      total: m.total
    }));

  const subjectAttendance = Object.values(subjectAttendanceMap).map(s => ({
    subject: s.subject,
    percentage: s.total > 0 ? Math.round((s.present / s.total) * 1000) / 10 : 0,
    total: s.total
  }));

  // 2. Academic Analytics (Exams & Marks)
  const publishedMarks = markDocs.filter(m => m.exam && m.exam.status === 'published');
  
  let academicAverage = null;
  let passCount = 0;
  const subjectMarksMap = {};
  const examPerformanceMap = {};

  if (publishedMarks.length > 0) {
    let totalPctSum = 0;
    publishedMarks.forEach(m => {
      const pct = m.percentage ?? (m.maxMarks > 0 ? (m.marksObtained / m.maxMarks) * 100 : 0);
      totalPctSum += pct;

      const passMarks = m.passMarks || (m.maxMarks * 0.33);
      if (m.marksObtained >= passMarks) passCount++;

      // Subject performance
      const subjName = m.subject?.name || 'Unknown';
      if (!subjectMarksMap[subjName]) {
        subjectMarksMap[subjName] = { name: subjName, totalPct: 0, count: 0, code: m.subject?.code };
      }
      subjectMarksMap[subjName].totalPct += pct;
      subjectMarksMap[subjName].count += 1;

      // Exam performance
      const examId = m.exam._id.toString();
      if (!examPerformanceMap[examId]) {
        examPerformanceMap[examId] = {
          id: examId,
          name: m.exam.name,
          date: m.exam.startDate,
          type: m.exam.type,
          status: m.exam.status,
          subjectsCount: 0,
          totalObtained: 0,
          totalMax: 0,
        };
      }
      examPerformanceMap[examId].subjectsCount += 1;
      examPerformanceMap[examId].totalObtained += m.marksObtained;
      examPerformanceMap[examId].totalMax += m.maxMarks;
    });

    academicAverage = Math.round((totalPctSum / publishedMarks.length) * 10) / 10;
  }

  const subjectPerformance = Object.values(subjectMarksMap).map(s => ({
    subject: s.name,
    code: s.code,
    percentage: Math.round((s.totalPct / s.count) * 10) / 10
  })).sort((a, b) => b.percentage - a.percentage);

  const bestSubject = subjectPerformance.length > 0 ? subjectPerformance[0] : null;
  const needingAttentionSubject = subjectPerformance.length > 1 ? subjectPerformance[subjectPerformance.length - 1] : null;

  const examList = Object.values(examPerformanceMap).map(e => {
    const pct = e.totalMax > 0 ? Math.round((e.totalObtained / e.totalMax) * 1000) / 10 : 0;
    let grade = 'N/A';
    if (pct >= 90) grade = 'A+';
    else if (pct >= 80) grade = 'A';
    else if (pct >= 70) grade = 'B';
    else if (pct >= 60) grade = 'C';
    else if (pct >= 33) grade = 'D';
    else grade = 'F';

    return {
      id: e.id,
      name: e.name,
      date: e.date,
      type: e.type,
      subjectsCount: e.subjectsCount,
      totalObtained: e.totalObtained,
      totalMax: e.totalMax,
      percentage: pct,
      grade,
      status: e.status
    };
  }).sort((a, b) => new Date(b.date) - new Date(a.date));

  // 3. Fee Analytics
  let totalAssignedFees = 0;
  let totalPaidFees = 0;
  let totalPendingFees = 0;
  let totalOverdueFees = 0;

  feeTxDocs.forEach(t => {
    totalAssignedFees += (t.amount || 0);
    totalPaidFees += (t.paidAmount || 0);
    const balance = t.balance ?? Math.max(0, (t.amount || 0) - (t.paidAmount || 0));
    if (t.status === 'pending' || t.status === 'partial') {
      totalPendingFees += balance;
    } else if (t.status === 'overdue') {
      totalPendingFees += balance;
      totalOverdueFees += balance;
    }
  });

  const hasFeeData = feeTxDocs.length > 0 || !!student.feeStructure;

  // 4. Homework Analytics
  let homeworkAssignedCount = homeworkDocs.length;
  let homeworkCompletedCount = 0;
  let homeworkPendingCount = 0;
  let homeworkOverdueCount = 0;

  const homeworkList = homeworkDocs.map(hw => {
    const sub = (hw.submissions || []).find(s => s.student?.toString() === id.toString());
    const isPastDue = new Date(hw.dueDate) < new Date();
    let status = 'pending';

    if (sub) {
      status = 'completed';
      homeworkCompletedCount++;
    } else if (isPastDue) {
      status = 'overdue';
      homeworkOverdueCount++;
    } else {
      status = 'pending';
      homeworkPendingCount++;
    }

    return {
      id: hw._id,
      title: hw.title,
      subject: hw.subject?.name || 'General',
      teacher: hw.teacher?.name || 'Teacher',
      assignedDate: hw.assignedDate,
      dueDate: hw.dueDate,
      status,
      marks: sub?.marks || null,
      feedback: sub?.feedback || null
    };
  }).sort((a, b) => new Date(b.dueDate) - new Date(a.dueDate));

  const homeworkCompletionPct = homeworkAssignedCount > 0
    ? Math.round((homeworkCompletedCount / homeworkAssignedCount) * 100)
    : null;

  // 5. Recognition & Badges
  const totalRecognitionPoints = recognitionDocs.reduce((acc, r) => acc + (r.points || 0), 0);
  const badgeList = badgeDocs.map(b => ({
    id: b._id,
    name: b.name,
    description: b.description,
    icon: b.icon,
    category: b.category,
    awardedAt: b.awardedTo?.find(a => a.student?.toString() === id.toString())?.awardedAt
  }));

  const recognitionHistory = recognitionDocs.map(r => ({
    id: r._id,
    points: r.points,
    category: r.category,
    note: r.note,
    awardedBy: r.awardedBy?.name || 'Teacher',
    date: r.createdAt
  })).sort((a, b) => new Date(b.date) - new Date(a.date));

  // 6. Documents
  const documentList = (student.documents || []).map(d => ({
    id: d._id || d.url,
    name: d.name,
    type: d.type || 'Custom Document',
    url: d.url,
    uploadedAt: d.uploadedAt || d.createdAt || new Date(),
    verificationStatus: 'verified'
  }));

  // 7. Consolidated Activity Timeline
  const activityItems = [];

  (student.statusHistory || []).forEach(sh => {
    activityItems.push({
      type: 'status_change',
      title: `Status changed from ${sh.from} to ${sh.to}`,
      description: sh.reason || `Student status updated to ${sh.to}`,
      timestamp: sh.date || student.updatedAt,
      icon: 'UserCheck'
    });
  });

  feeTxDocs.forEach(t => {
    if (t.paidAmount > 0) {
      activityItems.push({
        type: 'fee_payment',
        title: `Fee Payment Received: ₹${t.paidAmount.toLocaleString('en-IN')}`,
        description: `Receipt: ${t.receiptNo || 'N/A'} — ${t.paymentMethod || 'Online'}`,
        timestamp: t.paymentDate || t.updatedAt,
        icon: 'CreditCard'
      });
    }
  });

  recognitionDocs.forEach(r => {
    activityItems.push({
      type: 'recognition',
      title: `Awarded +${r.points} Recognition Points`,
      description: `${r.category?.toUpperCase()}: ${r.note || 'For active participation'} by ${r.awardedBy?.name || 'Teacher'}`,
      timestamp: r.createdAt,
      icon: 'Award'
    });
  });

  publishedMarks.forEach(m => {
    activityItems.push({
      type: 'exam_result',
      title: `Exam Marks Published: ${m.exam?.name} (${m.subject?.name})`,
      description: `Scored ${m.marksObtained}/${m.maxMarks} (${m.percentage || Math.round((m.marksObtained/m.maxMarks)*100)}%)`,
      timestamp: m.updatedAt || m.createdAt,
      icon: 'GraduationCap'
    });
  });

  auditLogs.forEach(al => {
    activityItems.push({
      type: 'audit',
      title: `Action: ${al.action.replace(/_/g, ' ').toUpperCase()}`,
      description: `Performed by ${al.actor?.name || 'Admin'}`,
      timestamp: al.createdAt,
      icon: 'Clock'
    });
  });

  activityItems.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  return {
    student: {
      _id: student._id,
      firstName: student.firstName,
      lastName: student.lastName,
      admissionNo: student.admissionNo,
      dateOfBirth: student.dateOfBirth,
      gender: student.gender,
      rollNo: student.rollNo,
      status: student.status,
      contact: student.contact,
      emergencyContacts: student.emergencyContacts,
      admissionDate: student.createdAt,
      currentClass: student.currentClass,
      currentSection: student.currentSection,
      academicYear: student.academicYear,
    },
    parents: parentDetails,
    kpis: {
      attendancePercentage,
      academicAverage,
      pendingFees: hasFeeData ? totalPendingFees : null,
      homeworkCompletionPct,
      recognitionPoints: totalRecognitionPoints,
    },
    academics: {
      academicAverage,
      passPercentage: publishedMarks.length > 0 ? Math.round((passCount / publishedMarks.length) * 100) : null,
      subjectPerformance,
      bestSubject,
      needingAttentionSubject,
      exams: examList
    },
    attendance: {
      overallPercentage: attendancePercentage,
      totalDays: attendanceTotalDays,
      presentCount: attendancePresentCount,
      absentCount: attendanceAbsentCount,
      lateCount: attendanceLateCount,
      leaveCount: attendanceLeaveCount,
      threshold: attendanceThreshold,
      isBelowThreshold: attendancePercentage !== null && attendancePercentage < attendanceThreshold,
      monthlyTrend: monthlyAttendanceTrend,
      subjectAttendance
    },
    fees: {
      hasData: hasFeeData,
      totalAssigned: totalAssignedFees,
      paidAmount: totalPaidFees,
      pendingAmount: totalPendingFees,
      overdueAmount: totalOverdueFees,
      transactions: feeTxDocs.map(t => ({
        id: t._id,
        receiptNo: t.receiptNo || 'N/A',
        structureName: t.feeStructure?.name || 'Fee',
        amount: t.amount,
        paidAmount: t.paidAmount,
        balance: t.balance,
        dueDate: t.dueDate,
        paymentDate: t.paymentDate,
        status: t.status,
        paymentMethod: t.paymentMethod
      }))
    },
    homework: {
      totalAssigned: homeworkAssignedCount,
      completed: homeworkCompletedCount,
      pending: homeworkPendingCount,
      overdue: homeworkOverdueCount,
      completionPercentage: homeworkCompletionPct,
      list: homeworkList
    },
    recognition: {
      points: totalRecognitionPoints,
      badgesCount: badgeList.length,
      badges: badgeList,
      history: recognitionHistory
    },
    documents: documentList,
    activityTimeline: activityItems.slice(0, 30)
  };
};
