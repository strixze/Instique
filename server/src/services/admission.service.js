import mongoose from 'mongoose';
import Admission from '../models/Admission.js';
import Student from '../models/Student.js';
import Parent from '../models/Parent.js';
import Section from '../models/Section.js';
import SchoolClass from '../models/SchoolClass.js';
import FeeStructure from '../models/FeeStructure.js';
import FeeTransaction from '../models/FeeTransaction.js';
import AcademicYear from '../models/AcademicYear.js';
import ApiError from '../utils/ApiError.js';
import { paginate } from '../utils/pagination.js';

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

export const getAdmissions = async (schoolId, options) => {
  const filter = { schoolId };

  if (options.academicSession) filter.academicSession = options.academicSession;
  if (options.applyingForClass) filter.applyingForClass = options.applyingForClass;
  if (options.workflowStatus) filter.workflowStatus = options.workflowStatus;

  // Search filter
  const searchFields = ['applicantName', 'applicationNo', 'parentPhone'];

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

  // Verify application approved
  const allowedStatuses = ['approved', 'class_allocated', 'fee_assigned', 'payment_pending', 'partially_paid', 'paid'];
  if (!allowedStatuses.includes(admission.workflowStatus)) {
    throw new ApiError(400, 'Application must be approved before class allocation.');
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

export const assignFeeStructure = async (id, schoolId, { feeStructureId, discountName, discountValue }, userId) => {
  const admission = await Admission.findOne({ _id: id, schoolId });
  if (!admission) throw new ApiError(404, 'Admission not found');

  if (admission.workflowStatus !== 'class_allocated' && admission.workflowStatus !== 'fee_assigned') {
    throw new ApiError(400, 'Class and section must be allocated before fee structure assignment.');
  }

  const structure = await FeeStructure.findOne({ _id: feeStructureId, schoolId });
  if (!structure) throw new ApiError(404, 'Fee structure not found');

  admission.feeStructure = feeStructureId;
  admission.feeDiscount = {
    name: discountName || undefined,
    value: Number(discountValue) || 0
  };
  admission.workflowStatus = 'fee_assigned';

  admission.history.push({
    status: 'fee_assigned',
    remarks: `Assigned fee structure: "${structure.name}" with discount/concession: ${discountName || 'None'} (₹${discountValue || 0})`,
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
    .populate('academicSession');

  if (!admission) throw new ApiError(404, 'Admission not found');

  if (admission.studentId) {
    throw new ApiError(400, 'Admission already confirmed. Student record already exists.');
  }

  // Confirm condition checks
  if (admission.workflowStatus !== 'paid') {
    // If they have a transaction and it is paid, we can proceed
    const paidTx = admission.feeTransactions.find(t => t.status === 'paid');
    if (!paidTx) {
      throw new ApiError(400, 'Admission fee payment must be fully satisfied before confirmation.');
    }
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
      'contact.phone': admission.father?.phone || admission.mother?.phone || admission.guardian?.phone
    }).session(session);

    if (!parent) {
      // Create father as primary parent if available, mother or guardian otherwise
      const parentFirstName = admission.father?.name?.split(' ')[0] || admission.mother?.name?.split(' ')[0] || admission.guardian?.name?.split(' ')[0] || 'Parent';
      const parentLastName = admission.father?.name?.split(' ').slice(1).join(' ') || admission.mother?.name?.split(' ').slice(1).join(' ') || admission.guardian?.name?.split(' ').slice(1).join(' ') || '';

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

    // 5. Update Admission Application
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

    await session.commitTransaction();
    session.endSession();

    return { admission, student };
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
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
