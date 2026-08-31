import crypto from 'crypto';
import Teacher from '../models/Teacher.js';
import { User } from '../models/User.js';
import School from '../models/School.js';
import AccountToken from '../models/AccountToken.js';
import AuditLog from '../models/AuditLog.js';
import ApiError from '../utils/ApiError.js';
import { paginate } from '../utils/pagination.js';
import env from '../config/env.js';
import { sendEmail } from './brevoMail.service.js';
import { getTeacherActivationEmailTemplate } from './emailTemplates/teacherActivation.template.js';
import { getPasswordResetEmailTemplate } from './emailTemplates/passwordReset.template.js';

/* ─────────────────────────────────────────────────────────────────────────
   Internal helpers
───────────────────────────────────────────────────────────────────────── */

const _generateActivationToken = async (userId) => {
  // Invalidate previous activation tokens
  await AccountToken.updateMany(
    { userId, type: 'activation', usedAt: null },
    { usedAt: new Date() }
  );

  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  const tokenDoc = await AccountToken.create({
    tokenHash,
    userId,
    type: 'activation',
    expiresAt,
    emailDeliveryStatus: 'pending',
  });

  return { rawToken, tokenDoc };
};

const _sendTeacherActivationEmail = async ({ teacher, user, school, rawToken }) => {
  const teacherName = user.name || `${teacher.firstName} ${teacher.lastName}`.trim();
  const schoolName = school?.name || 'Your School';
  const activationUrl = `${env.CLIENT_URL}/activate-account?token=${rawToken}`;

  const emailHtml = getTeacherActivationEmailTemplate({
    teacherName,
    schoolName,
    employeeId: teacher.employeeId,
    department: teacher.department,
    activationUrl,
    expiryHours: 24,
  });

  return sendEmail(
    user.email,
    `Welcome to Instique — Set Up Your Teacher Account`,
    emailHtml,
    teacherName
  );
};

/* ─────────────────────────────────────────────────────────────────────────
   Resolve live User accountStatus for a list of teachers
───────────────────────────────────────────────────────────────────────── */

const _resolveTeacherAccountStatuses = async (teachers, schoolId) => {
  if (!teachers || teachers.length === 0) return teachers;

  const profileIds = teachers.map((t) => t._id);
  const emails = teachers.map((t) => t.contact?.email).filter(Boolean).map((e) => e.toLowerCase().trim());

  const users = await User.find({
    schoolId,
    role: 'teacher',
    $or: [
      { profileId: { $in: profileIds } },
      { email: { $in: emails } },
    ],
  }).select('_id email status isActive profileId');

  const byProfileId = new Map();
  const byEmail = new Map();
  users.forEach((u) => {
    if (u.profileId) byProfileId.set(u.profileId.toString(), u);
    if (u.email) byEmail.set(u.email.toLowerCase().trim(), u);
  });

  return teachers.map((t) => {
    const tObj = t.toObject ? t.toObject() : { ...t };
    const teacherEmail = tObj.contact?.email?.toLowerCase().trim();
    const userAccount =
      byProfileId.get(tObj._id.toString()) ||
      (teacherEmail && byEmail.get(teacherEmail));

    let accountStatus = 'NOT_LINKED';
    if (userAccount) {
      if (userAccount.status === 'pending_activation') {
        accountStatus = 'PENDING_ACTIVATION';
      } else if (
        userAccount.status === 'suspended' ||
        userAccount.status === 'inactive' ||
        !userAccount.isActive
      ) {
        accountStatus = 'SUSPENDED';
      } else if (userAccount.status === 'active') {
        accountStatus = 'ACTIVE';
      } else {
        accountStatus = (userAccount.status || 'ACTIVE').toUpperCase();
      }
    }

    return { ...tObj, accountStatus, userAccountId: userAccount?._id || null };
  });
};

/* ─────────────────────────────────────────────────────────────────────────
   Public service functions
───────────────────────────────────────────────────────────────────────── */

export const createTeacher = async (schoolId, data, adminUser) => {
  // 1. Duplicate employee ID guard
  const existing = await Teacher.findOne({ schoolId, employeeId: data.employeeId });
  if (existing) throw new ApiError(409, 'Employee ID already exists');

  // 2. Email is required for account creation
  const teacherEmail = data.contact?.email?.toLowerCase().trim();
  if (!teacherEmail) {
    throw new ApiError(400, 'Teacher email is required for account creation and login');
  }

  // 3. Check for existing User with this email (global uniqueness)
  const existingUser = await User.findOne({ email: teacherEmail });
  if (existingUser) {
    throw new ApiError(409, `An account already exists with the email address: ${teacherEmail}`);
  }

  // 4. Create Teacher record
  const teacher = await Teacher.create({ ...data, schoolId });

  // 5. Create linked User account (PENDING_ACTIVATION)
  const tempPassword = crypto.randomBytes(24).toString('hex');
  const teacherUser = await User.create({
    schoolId,
    email: teacherEmail,
    password: tempPassword,
    role: 'teacher',
    profileId: teacher._id,
    profileModel: 'Teacher',
    name: `${teacher.firstName} ${teacher.lastName}`.trim(),
    phone: teacher.contact?.phone,
    status: 'pending_activation',
    isActive: false,
    emailVerified: false,
  });

  // 6. Generate activation token
  const { rawToken, tokenDoc } = await _generateActivationToken(teacherUser._id);

  // 7. Send Brevo activation email (after DB commit)
  const school = await School.findById(schoolId).select('name');
  const emailResult = await _sendTeacherActivationEmail({
    teacher,
    user: teacherUser,
    school,
    rawToken,
  });

  if (emailResult.success) {
    await AccountToken.findByIdAndUpdate(tokenDoc._id, { emailDeliveryStatus: 'sent' });
  } else {
    await AccountToken.findByIdAndUpdate(tokenDoc._id, {
      emailDeliveryStatus: 'failed',
      emailDeliveryError: emailResult.error,
    });
  }

  // 8. Audit log
  const actorId = adminUser?._id || adminUser?.id || adminUser?._doc?._id;
  if (actorId) {
    try {
      await AuditLog.create({
        schoolId,
        actor: actorId,
        action: 'teacher_account_created',
        entity: 'Teacher',
        entityId: teacher._id,
        after: { teacherId: teacher._id, email: teacherEmail },
        ip: adminUser._ip,
        userAgent: adminUser._userAgent,
      });
    } catch (auditErr) {
      console.error('Failed to create audit log for teacher creation:', auditErr);
    }
  }

  const teacherObj = teacher.toObject();
  return {
    ...teacherObj,
    accountStatus: 'PENDING_ACTIVATION',
    activationEmailSent: emailResult.success,
    activationEmailAddress: teacherEmail,
  };
};

export const getTeachers = async (schoolId, options) => {
  const { status, gender, ...rest } = options;
  const filter = {};
  if (status) filter.status = status;
  if (gender) filter.gender = gender;

  const result = await paginate(Teacher, { schoolId }, {
    ...rest,
    searchFields: ['firstName', 'lastName', 'employeeId', 'department'],
    filter,
  });

  result.data = await _resolveTeacherAccountStatuses(result.data, schoolId);

  return result;
};

export const getTeacherById = async (id, schoolId) => {
  const teacher = await Teacher.findOne({ _id: id, schoolId })
    .populate('subjects', 'name code')
    .populate('assignedClasses', 'name');
  if (!teacher) throw new ApiError(404, 'Teacher not found');
  return teacher;
};

export const updateTeacher = async (id, schoolId, data) => {
  const teacher = await Teacher.findOneAndUpdate({ _id: id, schoolId }, data, { new: true, runValidators: true });
  if (!teacher) throw new ApiError(404, 'Teacher not found');
  return teacher;
};

export const deleteTeacher = async (id, schoolId) => {
  const teacher = await Teacher.findOneAndDelete({ _id: id, schoolId });
  if (!teacher) throw new ApiError(404, 'Teacher not found');

  // Deactivate the linked user account on deletion (soft-deactivate, preserve audit trail)
  const teacherEmail = teacher.contact?.email?.toLowerCase().trim();
  if (teacherEmail) {
    await User.findOneAndUpdate(
      { email: teacherEmail, schoolId, role: 'teacher' },
      { status: 'inactive', isActive: false }
    );
  }

  return true;
};

export const getWorkloadAnalytics = async (schoolId) => {
  const teachers = await Teacher.find({ schoolId })
    .populate('assignedClasses', 'name')
    .populate('subjects', 'name weeklyPeriods');

  return teachers.map((t) => ({
    _id: t._id,
    name: `${t.firstName} ${t.lastName}`,
    employeeId: t.employeeId,
    assignedClasses: t.assignedClasses?.length || 0,
    subjectsCount: t.subjects?.length || 0,
    totalWeeklyPeriods: t.subjects?.reduce((sum, s) => sum + (s.weeklyPeriods || 0), 0) || 0,
    department: t.department,
    isClassTeacher: t.isClassTeacher,
  }));
};

/**
 * Resend activation email for a PENDING_ACTIVATION teacher account.
 * Invalidates previous tokens, generates a new one, sends via Brevo.
 */
export const resendTeacherActivationEmail = async (teacherId, schoolId, adminUser, ip, userAgent) => {
  const teacher = await Teacher.findOne({ _id: teacherId, schoolId });
  if (!teacher) throw new ApiError(404, 'Teacher not found');

  const teacherEmail = teacher.contact?.email?.toLowerCase().trim();
  if (!teacherEmail) {
    throw new ApiError(400, 'This teacher does not have an email address configured');
  }

  const user = await User.findOne({ email: teacherEmail, schoolId, role: 'teacher' });
  if (!user) {
    throw new ApiError(400, 'No user account found for this teacher. The account may not have been created yet.');
  }

  if (user.status === 'active' && user.emailVerified) {
    throw new ApiError(400, 'This teacher account is already active. Use "Send Password Reset" instead.');
  }

  if (user.status === 'suspended') {
    throw new ApiError(403, 'This teacher account is suspended. Reactivate the account before resending.');
  }

  // Invalidate previous tokens & generate new one
  const { rawToken, tokenDoc } = await _generateActivationToken(user._id);

  const school = await School.findById(schoolId).select('name');
  const emailResult = await _sendTeacherActivationEmail({ teacher, user, school, rawToken });

  if (emailResult.success) {
    await AccountToken.findByIdAndUpdate(tokenDoc._id, { emailDeliveryStatus: 'sent' });
  } else {
    await AccountToken.findByIdAndUpdate(tokenDoc._id, {
      emailDeliveryStatus: 'failed',
      emailDeliveryError: emailResult.error,
    });
    throw new ApiError(500, 'Unable to send activation email. Please try again.');
  }

  const actorId = adminUser?._id || adminUser?.id || adminUser?._doc?._id;
  if (actorId) {
    try {
      await AuditLog.create({
        schoolId,
        actor: actorId,
        action: 'teacher_activation_resent',
        entity: 'Teacher',
        entityId: teacher._id,
        after: { email: user.email },
        ip,
        userAgent,
      });
    } catch (auditErr) {
      console.error('Failed to create audit log for resending teacher activation:', auditErr);
    }
  }

  return { success: true, message: `Activation email resent successfully to ${user.email}` };
};

/**
 * Send a password reset email for an ACTIVE teacher account.
 * Reuses the same AccountToken + Brevo infrastructure as the generic forgotPassword flow.
 */
export const sendTeacherPasswordReset = async (teacherId, schoolId, adminUser, ip, userAgent) => {
  const teacher = await Teacher.findOne({ _id: teacherId, schoolId });
  if (!teacher) throw new ApiError(404, 'Teacher not found');

  const teacherEmail = teacher.contact?.email?.toLowerCase().trim();
  if (!teacherEmail) {
    throw new ApiError(400, 'This teacher does not have an email address configured');
  }

  const user = await User.findOne({ email: teacherEmail, schoolId, role: 'teacher' });
  if (!user) {
    throw new ApiError(400, 'No user account found for this teacher');
  }

  if (user.status === 'pending_activation') {
    throw new ApiError(400, 'This teacher account is pending activation. Use "Resend Activation Email" instead.');
  }

  if (user.status === 'suspended' || !user.isActive) {
    throw new ApiError(403, 'This teacher account is suspended. Password reset is not allowed.');
  }

  // Invalidate previous password reset tokens
  await AccountToken.updateMany(
    { userId: user._id, type: 'password_reset', usedAt: null },
    { usedAt: new Date() }
  );

  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  const tokenDoc = await AccountToken.create({
    tokenHash,
    userId: user._id,
    type: 'password_reset',
    expiresAt,
    emailDeliveryStatus: 'pending',
  });

  const school = await School.findById(schoolId).select('name');
  const teacherName = user.name || `${teacher.firstName} ${teacher.lastName}`.trim();
  const resetUrl = `${env.CLIENT_URL}/reset-password?token=${rawToken}`;

  const emailHtml = getPasswordResetEmailTemplate({
    userName: teacherName,
    resetUrl,
    expiryMinutes: 60,
  });

  const emailResult = await sendEmail(
    user.email,
    `Reset Your Instique Teacher Account Password — ${school?.name || 'Instique'}`,
    emailHtml,
    teacherName
  );

  if (emailResult.success) {
    await AccountToken.findByIdAndUpdate(tokenDoc._id, { emailDeliveryStatus: 'sent' });
  } else {
    await AccountToken.findByIdAndUpdate(tokenDoc._id, {
      emailDeliveryStatus: 'failed',
      emailDeliveryError: emailResult.error,
    });
    throw new ApiError(500, 'Unable to send password reset email. Please try again.');
  }

  const actorId = adminUser?._id || adminUser?.id || adminUser?._doc?._id;
  if (actorId) {
    try {
      await AuditLog.create({
        schoolId,
        actor: actorId,
        action: 'teacher_password_reset_sent',
        entity: 'Teacher',
        entityId: teacher._id,
        after: { email: user.email },
        ip,
        userAgent,
      });
    } catch (auditErr) {
      console.error('Failed to create audit log for teacher password reset:', auditErr);
    }
  }

  return {
    success: true,
    message: `Password reset link sent to ${user.email}`,
    email: user.email,
    teacherName,
  };
};
