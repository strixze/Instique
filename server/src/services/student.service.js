import crypto from 'crypto';
import Student from '../models/Student.js';
import Parent from '../models/Parent.js';
import { User } from '../models/user.model.js';
import School from '../models/School.js';
import AccountToken from '../models/AccountToken.js';
import AuditLog from '../models/AuditLog.js';
import Section from '../models/Section.js';
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
