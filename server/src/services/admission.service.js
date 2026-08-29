import mongoose from 'mongoose';
import crypto from 'crypto';
import env from '../config/env.js';
import Admission from '../models/Admission.js';
import Student from '../models/Student.js';
import Parent from '../models/Parent.js';
import User from '../models/User.js';
import AccountToken from '../models/AccountToken.js';
import School from '../models/School.js';
import AuditLog from '../models/AuditLog.js';
import Section from '../models/Section.js';
import SchoolClass from '../models/SchoolClass.js';
import FeeStructure from '../models/FeeStructure.js';
import FeeTransaction from '../models/FeeTransaction.js';
import AcademicYear from '../models/AcademicYear.js';
import InstallmentConfig from '../models/InstallmentConfig.js';
import ApiError from '../utils/ApiError.js';
import { paginate } from '../utils/pagination.js';
import { sendEmail } from './brevoMail.service.js';
import { getParentActivationEmailTemplate } from './emailTemplates/parentActivation.template.js';

export const createAdmission = async (schoolId, data, userId) => {
  const academicSession = await AcademicYear.findById(data.academicSession);
  if (!academicSession) throw new ApiError(404, 'Academic session not found');

  const year = academicSession.name.slice(0, 4) || new Date().getFullYear().toString();
  
  // Unique application number within the school
  const count = await Admission.countDocuments({ schoolId });
  const applicationNo = `ADM-${year}-${(count + 1).toString().padStart(5, '0')}`;

  const applicantName = [data.firstName, data.middleName, data.lastName].filter(Boolean).join(' ');

  const initialHistory = [{
    status: data.workflowStatus || 'submitted',
    remarks: 'Application submitted',
    updatedBy: userId,
    updatedAt: new Date()
  }];

  const admission = await Admission.create({
    ...data,
    schoolId,
    applicantName,
    applicationNo,
    workflowStatus: data.workflowStatus || 'submitted',
    history: initialHistory
  });

  return admission;
};

export const getAdmissionStats = async (schoolId) => {
  const [total, submitted, underReview, approved, enrolled, rejected] = await Promise.all([
    Admission.countDocuments({ schoolId }),
    Admission.countDocuments({ schoolId, workflowStatus: 'submitted' }),
    Admission.countDocuments({ schoolId, workflowStatus: { $in: ['under_review', 'document_verification'] } }),
    Admission.countDocuments({ schoolId, workflowStatus: { $in: ['approved', 'class_allocated', 'fee_assigned', 'payment_pending', 'partially_paid', 'paid'] } }),
    Admission.countDocuments({ schoolId, workflowStatus: { $in: ['admitted', 'student_created'] } }),
    Admission.countDocuments({ schoolId, workflowStatus: 'rejected' }),
  ]);

  return { total, submitted, underReview, approved, enrolled, rejected };
};

export const getAdmissions = async (schoolId, options) => {
  const filter = { schoolId };

  if (options.academicSession) filter.academicSession = options.academicSession;
  if (options.applyingForClass) filter.applyingForClass = options.applyingForClass;
  if (options.workflowStatus && options.workflowStatus !== 'all') filter.workflowStatus = options.workflowStatus;
  if (options.gender && options.gender !== 'all') filter.gender = options.gender;

  if (options.startDate || options.endDate) {
    filter.createdAt = {};
    if (options.startDate) filter.createdAt.$gte = new Date(options.startDate);
    if (options.endDate) {
      const end = new Date(options.endDate);
      end.setHours(23, 59, 59, 999);
      filter.createdAt.$lte = end;
    }
  }

  // Search filter
  const searchFields = ['applicantName', 'applicationNo', 'parentPhone', 'father.name', 'mother.name'];

  return paginate(Admission, filter, {
    ...options,
    searchFields,
    populate: [
      { path: 'applyingForClass', select: 'name' },
      { path: 'academicSession', select: 'name' },
      { path: 'assignedClass', select: 'name' },
      { path: 'assignedSection', select: 'name' },
      { path: 'feeStructure', select: 'name totalAmount' },
      { path: 'studentId', select: 'admissionNo rollNo' }
    ]
  });
};

export const getAdmissionById = async (id, schoolId) => {
  const admission = await Admission.findOne({ _id: id, schoolId })
    .populate('applyingForClass', 'name')
    .populate('academicSession', 'name')
    .populate('assignedClass', 'name')
    .populate('assignedSection', 'name')
    .populate('feeStructure')
    .populate('feeTransactions')
    .populate('studentId')
    .populate('history.updatedBy', 'firstName lastName email');
    
  if (!admission) throw new ApiError(404, 'Admission not found');
  return admission;
};

export const updateDocumentStatus = async (id, schoolId, documentId, { status, rejectionReason }, userId) => {
  const admission = await Admission.findOne({ _id: id, schoolId });
  if (!admission) throw new ApiError(404, 'Admission application not found');

  const doc = admission.documents.id(documentId);
  if (!doc) throw new ApiError(404, 'Document not found');

  doc.status = status;
  doc.rejectionReason = status === 'rejected' ? rejectionReason : undefined;
  doc.verifiedBy = userId;
  doc.verifiedAt = new Date();

  // Add history log
  admission.history.push({
    status: admission.workflowStatus,
    remarks: `Document "${doc.name}" updated to "${status}"${status === 'rejected' ? `: ${rejectionReason}` : ''}`,
    updatedBy: userId,
    updatedAt: new Date()
  });

  await admission.save();
  return admission;
};

export const updateAdmissionStatus = async (id, schoolId, status, remarks, userId) => {
  const admission = await Admission.findOne({ _id: id, schoolId });
  if (!admission) throw new ApiError(404, 'Admission not found');

  // Validations
  if (status === 'approved') {
    // Check if there are any documents and all must be verified
    const pendingDocs = admission.documents.filter(d => d.status !== 'verified');
    if (pendingDocs.length > 0) {
      throw new ApiError(400, 'Cannot approve application: All uploaded documents must be verified first.');
    }
  }

  if (status === 'rejected' && !remarks) {
    throw new ApiError(400, 'Rejection reason (remarks) is required.');
  }

  admission.workflowStatus = status;
  if (remarks) admission.remarks = remarks;

  admission.history.push({
    status,
    remarks: remarks || `Status updated to ${status}`,
    updatedBy: userId,
    updatedAt: new Date()
  });

  await admission.save();
  return admission;
};

export const allocateClassSection = async (id, schoolId, { assignedClassId, assignedSectionId }, userId) => {
  const admission = await Admission.findOne({ _id: id, schoolId });
  if (!admission) throw new ApiError(404, 'Admission not found');

  // Verify application status allows allocation
  const allowedStatuses = ['submitted', 'document_verification', 'under_review', 'approved', 'class_allocated', 'fee_assigned', 'payment_pending', 'partially_paid', 'paid'];
  if (!allowedStatuses.includes(admission.workflowStatus)) {
    throw new ApiError(400, 'Application is not in a valid stage for class allocation.');
  }

  const cls = await SchoolClass.findOne({ _id: assignedClassId, schoolId });
  if (!cls) throw new ApiError(404, 'Class not found');

  const section = await Section.findOne({ _id: assignedSectionId, schoolClass: assignedClassId, schoolId });
  if (!section) throw new ApiError(404, 'Section not found in selected class');

  // Check section capacity limit
  const activeStudentCount = await Student.countDocuments({
    schoolId,
    currentSection: assignedSectionId,
    status: 'active'
  });

  if (section.strength > 0 && activeStudentCount >= section.strength) {
    throw new ApiError(400, `Section "${section.name}" is full (Capacity: ${section.strength}, Current: ${activeStudentCount})`);
  }

  admission.assignedClass = assignedClassId;
  admission.assignedSection = assignedSectionId;
  admission.workflowStatus = 'class_allocated';

  admission.history.push({
    status: 'class_allocated',
    remarks: `Allocated to Class: ${cls.name}, Section: ${section.name}`,
    updatedBy: userId,
    updatedAt: new Date()
  });

  await admission.save();
  return admission;
};

export const assignFeeStructure = async (id, schoolId, { feeStructureId, discountName, discountValue, installments }, userId) => {
  const admission = await Admission.findOne({ _id: id, schoolId });
  if (!admission) throw new ApiError(404, 'Admission not found');

  if (admission.workflowStatus !== 'class_allocated' && admission.workflowStatus !== 'fee_assigned') {
    throw new ApiError(400, 'Class and section must be allocated before fee structure assignment.');
  }

  const structure = await FeeStructure.findOne({ _id: feeStructureId, schoolId });
  if (!structure) throw new ApiError(404, 'Fee structure not found');

  // Use custom installments if provided, otherwise use the structure's defaults
  const finalInstallments = (installments && installments.length > 0) ? installments : (structure.installments || [100]);

  admission.feeStructure = feeStructureId;
  admission.feeDiscount = {
    name: discountName || undefined,
    value: Number(discountValue) || 0
  };
  admission.installments = finalInstallments;
  admission.workflowStatus = 'fee_assigned';

  admission.history.push({
    status: 'fee_assigned',
    remarks: `Assigned fee structure: "${structure.name}" with discount/concession: ${discountName || 'None'} (₹${discountValue || 0}). Installments: ${finalInstallments.join('% → ')}%`,
    updatedBy: userId,
    updatedAt: new Date()
  });

  await admission.save();
  return admission;
};

export const recordManualPayment = async (id, schoolId, paymentData, userId) => {
  const admission = await Admission.findOne({ _id: id, schoolId })
    .populate('feeStructure')
    .populate('feeTransactions');
    
  if (!admission) throw new ApiError(404, 'Admission not found');

  if (!admission.feeStructure) {
    throw new ApiError(400, 'Fee structure must be assigned before recording payment.');
  }

  const { amountPaid, paymentMethod, referenceNo, paymentDate, notes } = paymentData;
  const numAmountPaid = Number(amountPaid);

  if (isNaN(numAmountPaid) || numAmountPaid <= 0) {
    throw new ApiError(400, 'Valid paid amount is required');
  }

  // Find or create transaction
  let transaction = admission.feeTransactions[0];
  const netRequiredAmount = Math.max(0, admission.feeStructure.totalAmount - (admission.feeDiscount?.value || 0));

  // Validate minimum payment criteria (must be >= first installment)
  let firstPercentage = 100;
  if (admission.installments && admission.installments.length > 0 && admission.installments[0] !== 100) {
    firstPercentage = admission.installments[0];
  } else {
    const installmentConfig = await InstallmentConfig.findOne({ isActive: true });
    firstPercentage = installmentConfig?.percentages?.[0] ?? 100;
  }

  const minRequiredForAdmission = (netRequiredAmount * firstPercentage) / 100;
  const currentPaid = transaction ? (transaction.paidAmount || 0) : 0;
  const totalCumulativePaid = currentPaid + numAmountPaid;

  if (totalCumulativePaid < minRequiredForAdmission) {
    throw new ApiError(
      400,
      `Payment amount of ₹${numAmountPaid} is insufficient. The first installment requires at least ${firstPercentage}% of total fees (₹${minRequiredForAdmission}). Total paid: ₹${totalCumulativePaid}`
    );
  }

  if (totalCumulativePaid > netRequiredAmount) {
    throw new ApiError(
      400,
      `Payment amount of ₹${numAmountPaid} exceeds the remaining balance of ₹${netRequiredAmount - currentPaid}. Total fee: ₹${netRequiredAmount}, Paid so far: ₹${currentPaid}`
    );
  }

  if (!transaction) {
    const balance = Math.max(0, netRequiredAmount - numAmountPaid);
    const status = balance <= 0 ? 'paid' : 'partial';

    transaction = await FeeTransaction.create({
      schoolId,
      feeStructure: admission.feeStructure._id,
      academicYear: admission.academicSession,
      amount: netRequiredAmount,
      paidAmount: numAmountPaid,
      discount: admission.feeDiscount?.name ? { name: admission.feeDiscount.name, amount: admission.feeDiscount.value } : undefined,
      balance,
      status,
      paymentMethod,
      transactionId: referenceNo,
      remarks: notes,
      paymentDate: paymentDate || new Date(),
      paidBy: userId
    });

    admission.feeTransactions.push(transaction._id);
  } else {
    // Cumulative payment update
    const updatedPaid = transaction.paidAmount + numAmountPaid;
    const balance = Math.max(0, transaction.amount - updatedPaid);
    const status = balance <= 0 ? 'paid' : 'partial';

    transaction.paidAmount = updatedPaid;
    transaction.balance = balance;
    transaction.status = status;
    transaction.paymentMethod = paymentMethod;
    if (referenceNo) transaction.transactionId = referenceNo;
    if (notes) transaction.remarks = notes;
    transaction.paymentDate = paymentDate || new Date();
    transaction.paidBy = userId;

    await transaction.save();
  }

  // Set workflow status
  let nextStatus = 'payment_pending';
  if (transaction.status === 'paid') {
    nextStatus = 'paid';
  } else if (transaction.status === 'partial') {
    nextStatus = 'partially_paid';
  }

  admission.workflowStatus = nextStatus;
  admission.history.push({
    status: nextStatus,
    remarks: `Manual payment of ₹${numAmountPaid} recorded via ${paymentMethod}. Remaining Balance: ₹${transaction.balance}`,
    updatedBy: userId,
    updatedAt: new Date()
  });

  await admission.save();
  return { admission, transaction };
};

export const confirmAdmission = async (id, schoolId, userId) => {
  const admission = await Admission.findOne({ _id: id, schoolId })
    .populate('feeTransactions')
    .populate('applyingForClass')
    .populate('academicSession')
    .populate('feeStructure');

  if (!admission) throw new ApiError(404, 'Admission not found');

  if (admission.studentId) {
    throw new ApiError(400, 'Admission already confirmed. Student record already exists.');
  }

  // Check installment eligibility
  // Priority: admission-level installments > global InstallmentConfig > default 100%
  let firstPercentage = 100;
  if (admission.installments && admission.installments.length > 0 && admission.installments[0] !== 100) {
    firstPercentage = admission.installments[0];
  } else {
    const installmentConfig = await InstallmentConfig.findOne({ isActive: true });
    firstPercentage = installmentConfig?.percentages?.[0] ?? 100;
  }

  const totalAmount = admission.feeStructure?.totalAmount || 0;
  const netRequiredAmount = Math.max(0, totalAmount - (admission.feeDiscount?.value || 0));
  const minRequiredForAdmission = (netRequiredAmount * firstPercentage) / 100;

  const transaction = admission.feeTransactions[0];
  const totalPaid = transaction ? (transaction.paidAmount || 0) : 0;

  if (totalPaid < minRequiredForAdmission) {
    throw new ApiError(
      400,
      `Admission fee payment of at least the first installment (${firstPercentage}%: ₹${minRequiredForAdmission}) is required before confirmation. Current paid: ₹${totalPaid}`
    );
  }

  if (!admission.assignedClass || !admission.assignedSection) {
    throw new ApiError(400, 'Class and section must be allocated before confirming admission.');
  }

  // Check manual verification status
  const pendingDocs = admission.documents.filter(d => d.status !== 'verified');
  if (pendingDocs.length > 0) {
    throw new ApiError(400, 'All documents must be verified before confirming admission.');
  }

  const sessionYear = admission.academicSession.name.slice(0, 4) || new Date().getFullYear().toString();

  // Create Student and Parent atomically (or safely in try-catch)
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    // 1. Generate roll number (current section count + 1)
    const currentSectionCount = await Student.countDocuments({
      schoolId,
      currentClass: admission.assignedClass,
      currentSection: admission.assignedSection,
      academicYear: admission.academicSession._id,
      status: 'active'
    }).session(session);

    const rollNo = currentSectionCount + 1;

    // 2. Generate Unique Student ID
    const studentCount = await Student.countDocuments({ schoolId }).session(session);
    const admissionNo = `STU-${sessionYear}-${(studentCount + 1).toString().padStart(5, '0')}`;

    // 3. Find or Create Parent
    let parent = await Parent.findOne({
      schoolId,
      'contact.phone': admission.father?.phone || admission.mother?.phone || admission.guardian?.phone || admission.parentPhone
    }).session(session);

    if (!parent) {
      // Create father as primary parent if available, mother or guardian otherwise
      const parentFirstName = admission.father?.name?.split(' ')[0] || admission.mother?.name?.split(' ')[0] || admission.guardian?.name?.split(' ')[0] || 'Parent';
      const fatherLastName = admission.father?.name ? admission.father.name.split(' ').slice(1).join(' ').trim() : '';
      const motherLastName = admission.mother?.name ? admission.mother.name.split(' ').slice(1).join(' ').trim() : '';
      const guardianLastName = admission.guardian?.name ? admission.guardian.name.split(' ').slice(1).join(' ').trim() : '';
      const parentLastName = fatherLastName || motherLastName || guardianLastName || admission.lastName || '-';

      parent = await Parent.create([{
        schoolId,
        firstName: parentFirstName,
        lastName: parentLastName,
        relation: admission.father?.name ? 'father' : (admission.mother?.name ? 'mother' : 'guardian'),
        contact: {
          phone: admission.father?.phone || admission.mother?.phone || admission.guardian?.phone || admission.parentPhone,
          email: admission.father?.email || admission.mother?.email || admission.guardian?.email || admission.parentEmail,
          address: admission.address
        },
        occupation: admission.father?.occupation || admission.mother?.occupation || undefined,
        students: []
      }], { session });
      parent = parent[0];
    }

    // 4. Create Student
    const studentDocs = admission.documents.map(d => ({
      name: d.name,
      type: d.type,
      url: d.url,
      uploadedAt: d.verifiedAt || new Date()
    }));

    const studentArr = await Student.create([{
      schoolId,
      firstName: admission.firstName,
      lastName: admission.lastName,
      dateOfBirth: admission.dateOfBirth,
      gender: admission.gender,
      admissionNo,
      rollNo,
      currentClass: admission.assignedClass,
      currentSection: admission.assignedSection,
      academicYear: admission.academicSession._id,
      parents: [parent._id],
      admission: admission._id,
      contact: {
        phone: admission.parentPhone,
        email: admission.parentEmail,
        address: [admission.address, admission.city, admission.state, admission.pincode].filter(Boolean).join(', ')
      },
      documents: studentDocs,
      feeStructure: admission.feeStructure?._id || admission.feeStructure || undefined,
      installments: admission.installments || [100],
      status: 'active'
    }], { session });
    const student = studentArr[0];

    // Link student back to parent
    parent.students.push(student._id);
    await parent.save({ session });

    // Link fee transactions to created student
    await FeeTransaction.updateMany(
      { _id: { $in: admission.feeTransactions } },
      { student: student._id },
      { session }
    );

    // 5. Create / Link Parent User Account and generate secure activation token
    const parentEmail = parent.contact?.email || admission.parentEmail;
    let parentUser = null;
    let rawActivationToken = null;
    let tokenRecord = null;

    if (parentEmail) {
      const normalizedEmail = parentEmail.toLowerCase().trim();
      parentUser = await User.findOne({ email: normalizedEmail }).session(session);

      if (!parentUser) {
        const tempPassword = crypto.randomBytes(24).toString('hex');
        const parentFullName = `${parent.firstName} ${parent.lastName}`.trim();
        const createdUsers = await User.create([{
          schoolId,
          email: normalizedEmail,
          password: tempPassword,
          role: 'parent',
          profileId: parent._id,
          profileModel: 'Parent',
          name: parentFullName,
          phone: parent.contact?.phone || admission.parentPhone,
          status: 'pending_activation',
          isActive: false,
          emailVerified: false,
        }], { session });
        parentUser = createdUsers[0];
      } else if (!parentUser.profileId && parentUser.role === 'parent') {
        parentUser.profileId = parent._id;
        parentUser.profileModel = 'Parent';
        await parentUser.save({ session });
      }

      // Generate activation token if account is pending activation or not verified
      if (parentUser && (parentUser.status === 'pending_activation' || !parentUser.emailVerified)) {
        // Invalidate any previous activation tokens
        await AccountToken.updateMany(
          { userId: parentUser._id, type: 'activation', usedAt: null },
          { usedAt: new Date() },
          { session }
        );

        rawActivationToken = crypto.randomBytes(32).toString('hex');
        const tokenHash = crypto.createHash('sha256').update(rawActivationToken).digest('hex');
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

        const createdTokens = await AccountToken.create([{
          tokenHash,
          userId: parentUser._id,
          type: 'activation',
          expiresAt,
          emailDeliveryStatus: 'pending'
        }], { session });
        tokenRecord = createdTokens[0];
      }
    }

    // 6. Update Admission Application
    admission.studentId = student._id;
    admission.workflowStatus = 'student_created';
    admission.history.push({
      status: 'admitted',
      remarks: 'Admission confirmed.',
      updatedBy: userId,
      updatedAt: new Date()
    });
    admission.history.push({
      status: 'student_created',
      remarks: `Student record created with ID: ${admissionNo}, Roll No: ${rollNo}`,
      updatedBy: userId,
      updatedAt: new Date()
    });

    await admission.save({ session });

    // CRITICAL: Commit transaction FIRST before attempting to send Brevo email
    await session.commitTransaction();
    session.endSession();

    // 7. AFTER TRANSACTION COMMIT: Send Brevo Activation Email to Parent
    let activationEmailSent = false;
    if (parentUser && rawActivationToken && tokenRecord) {
      try {
        const [school, schoolClass, section] = await Promise.all([
          School.findById(schoolId),
          SchoolClass.findById(admission.assignedClass),
          Section.findById(admission.assignedSection)
        ]);

        const schoolName = school?.name || 'Instique School';
        const parentName = parentUser.name || `${parent.firstName} ${parent.lastName}`.trim();
        const studentName = `${student.firstName} ${student.lastName}`.trim();
        const className = `${schoolClass?.name || 'Class'} ${section?.name ? `- Section ${section.name}` : ''}`.trim();
        const activationUrl = `${env.CLIENT_URL}/activate-account?token=${rawActivationToken}`;

        const emailHtml = getParentActivationEmailTemplate({
          parentName,
          schoolName,
          studentName,
          className,
          activationUrl,
          expiryHours: 24
        });

        const emailResult = await sendEmail(
          parentUser.email,
          'Welcome to Instique — Set Up Your Parent Account',
          emailHtml,
          parentName
        );

        if (emailResult.success) {
          activationEmailSent = true;
          await AccountToken.findByIdAndUpdate(tokenRecord._id, { emailDeliveryStatus: 'sent' });
          console.log(`✅ Parent account activation email sent to ${parentUser.email}`);
        } else {
          await AccountToken.findByIdAndUpdate(tokenRecord._id, {
            emailDeliveryStatus: 'failed',
            emailDeliveryError: emailResult.error
          });
          console.error(`⚠️ Brevo email sending failed for ${parentUser.email}:`, emailResult.error);
        }

        // Record Audit Activity
        await AuditLog.create({
          schoolId,
          actor: userId,
          action: 'parent_activation_email_dispatched',
          entity: 'User',
          entityId: parentUser._id,
          after: { emailSent: emailResult.success, parentEmail: parentUser.email }
        });
      } catch (emailErr) {
        // Never roll back DB or throw fatal error if Brevo fails
        console.error('⚠️ Unexpected error while preparing/sending parent activation email:', emailErr.message);
        if (tokenRecord) {
          await AccountToken.findByIdAndUpdate(tokenRecord._id, {
            emailDeliveryStatus: 'failed',
            emailDeliveryError: emailErr.message
          }).catch(() => {});
        }
      }
    }

    return { 
      admission, 
      student, 
      parent, 
      parentUser: parentUser ? { _id: parentUser._id, email: parentUser.email, status: parentUser.status } : null,
      activationEmailSent 
    };
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

export const resendAdmissionActivationEmail = async (id, schoolId, userId, ip, userAgent) => {
  const admission = await Admission.findOne({ _id: id, schoolId })
    .populate('studentId')
    .populate('assignedClass')
    .populate('assignedSection');

  if (!admission) throw new ApiError(404, 'Admission not found');
  if (!admission.studentId) throw new ApiError(400, 'Student record has not been created yet for this application');

  const student = await Student.findById(admission.studentId).populate('parents');
  if (!student || !student.parents || student.parents.length === 0) {
    throw new ApiError(404, 'Parent record not found for this student');
  }

  const parent = student.parents[0];
  const parentEmail = parent.contact?.email || admission.parentEmail;
  if (!parentEmail) {
    throw new ApiError(400, 'Parent email address is missing. Please update parent contact details first.');
  }

  const normalizedEmail = parentEmail.toLowerCase().trim();
  let user = await User.findOne({ email: normalizedEmail });

  if (!user) {
    const tempPassword = crypto.randomBytes(24).toString('hex');
    user = await User.create({
      schoolId,
      email: normalizedEmail,
      password: tempPassword,
      role: 'parent',
      profileId: parent._id,
      profileModel: 'Parent',
      name: `${parent.firstName} ${parent.lastName}`.trim(),
      phone: parent.contact?.phone,
      status: 'pending_activation',
      isActive: false,
      emailVerified: false,
    });
  }

  if (user.status === 'active' && user.emailVerified) {
    throw new ApiError(400, 'This parent account is already active and verified.');
  }

  // Invalidate previous activation tokens
  await AccountToken.updateMany(
    { userId: user._id, type: 'activation', usedAt: null },
    { usedAt: new Date() }
  );

  // Generate fresh token
  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  const accountToken = await AccountToken.create({
    tokenHash,
    userId: user._id,
    type: 'activation',
    expiresAt,
    emailDeliveryStatus: 'pending'
  });

  const school = await School.findById(schoolId);
  const parentName = user.name || `${parent.firstName} ${parent.lastName}`.trim();
  const studentName = `${student.firstName} ${student.lastName}`.trim();
  const className = `${admission.assignedClass?.name || 'Class'} ${admission.assignedSection?.name ? `- Section ${admission.assignedSection.name}` : ''}`.trim();
  const activationUrl = `${env.CLIENT_URL}/activate-account?token=${rawToken}`;

  const emailHtml = getParentActivationEmailTemplate({
    parentName,
    schoolName: school?.name || 'Instique School',
    studentName,
    className,
    activationUrl,
    expiryHours: 24
  });

  const emailResult = await sendEmail(
    user.email,
    'Welcome to Instique — Set Up Your Parent Account',
    emailHtml,
    parentName
  );

  if (!emailResult.success) {
    await AccountToken.findByIdAndUpdate(accountToken._id, {
      emailDeliveryStatus: 'failed',
      emailDeliveryError: emailResult.error
    });
    throw new ApiError(500, 'Unable to send the activation email. Please try again.');
  }

  await AccountToken.findByIdAndUpdate(accountToken._id, { emailDeliveryStatus: 'sent' });

  await AuditLog.create({
    schoolId,
    actor: userId,
    action: 'resend_parent_activation',
    entity: 'User',
    entityId: user._id,
    ip,
    userAgent,
    after: { email: user.email }
  });

  return { success: true, message: `Activation email sent successfully to ${user.email}` };
};


export const updateDocuments = async (id, schoolId, documents) => {
  const admission = await Admission.findOne({ _id: id, schoolId });
  if (!admission) throw new ApiError(404, 'Admission not found');

  const formattedDocs = documents.map(d => ({
    name: d.name,
    type: d.type,
    url: d.url,
    status: 'uploaded',
    uploadedAt: new Date()
  }));

  admission.documents.push(...formattedDocs);
  admission.workflowStatus = 'document_verification';
  
  admission.history.push({
    status: 'document_verification',
    remarks: `Uploaded ${formattedDocs.length} new document(s)`,
    updatedBy: undefined,
    updatedAt: new Date()
  });

  await admission.save();
  return admission;
};
