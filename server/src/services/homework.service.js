import Homework from '../models/Homework.js';
import Teacher from '../models/Teacher.js';
import Student from '../models/Student.js';
import Parent from '../models/Parent.js';
import SchoolClass from '../models/SchoolClass.js';
import Section from '../models/Section.js';
import Subject from '../models/Subject.js';
import AcademicYear from '../models/AcademicYear.js';
import { User } from '../models/user.model.js';
import ApiError from '../utils/ApiError.js';
import { paginate } from '../utils/pagination.js';
import { uploadFileOnCloudinary, deleteFileFromCloudinary } from './cloudinary.service.js';
import { sendBulkNotification } from './notification.service.js';

/**
 * Get teacher's authorized classes, sections, and subjects
 */
export const getTeacherAssignments = async (schoolId, user) => {
  if (user.role === 'school_admin' || user.role === 'super_admin') {
    const [classes, sections, subjects, teachers] = await Promise.all([
      SchoolClass.find({ schoolId }).sort('order name'),
      Section.find({ schoolId }).sort('name'),
      Subject.find({ schoolId }).sort('name'),
      Teacher.find({ schoolId, status: 'active' }).select('firstName lastName employeeId'),
    ]);

    return {
      classes,
      sections,
      subjects,
      teachers,
    };
  }

  // Teacher role
  const teacher = await Teacher.findOne({
    schoolId,
    $or: [{ _id: user.profileId }, { 'contact.email': user.email }],
  })
    .populate('assignedClasses', 'name order')
    .populate('assignedSections', 'name')
    .populate('subjects', 'name code')
    .populate('classTeacherOf', 'name')
    .populate('classTeacherSection', 'name');

  if (!teacher) {
    throw new ApiError(404, 'Teacher profile not found for authenticated user');
  }

  // Combine assigned classes and class teacher class
  const classMap = new Map();
  (teacher.assignedClasses || []).forEach((c) => classMap.set(c._id.toString(), c));
  if (teacher.classTeacherOf) {
    classMap.set(teacher.classTeacherOf._id.toString(), teacher.classTeacherOf);
  }
  const classes = Array.from(classMap.values());

  // Sections
  const sectionMap = new Map();
  (teacher.assignedSections || []).forEach((s) => sectionMap.set(s._id.toString(), s));
  if (teacher.classTeacherSection) {
    sectionMap.set(teacher.classTeacherSection._id.toString(), teacher.classTeacherSection);
  }

  // If teacher has assigned classes, query all sections for those classes so they can pick the right section
  if (classes.length > 0) {
    const classIds = classes.map((c) => c._id);
    const relatedSections = await Section.find({ schoolId, schoolClass: { $in: classIds } });
    relatedSections.forEach((s) => sectionMap.set(s._id.toString(), s));
  }
  const sections = Array.from(sectionMap.values());

  // Subjects
  const subjects = teacher.subjects || [];

  return {
    teacher: {
      _id: teacher._id,
      firstName: teacher.firstName,
      lastName: teacher.lastName,
      employeeId: teacher.employeeId,
      isClassTeacher: teacher.isClassTeacher,
    },
    classes,
    sections,
    subjects,
  };
};

/**
 * Create a new homework with optional file attachments and notification dispatch
 */
export const createHomework = async (schoolId, user, data, files = []) => {
  // 1. Resolve Academic Year
  const activeYear = await AcademicYear.findOne({ schoolId, isCurrent: true })
    || await AcademicYear.findOne({ schoolId }).sort({ createdAt: -1 });

  // 2. Resolve Teacher Identity & Authorize Assignments
  let teacherId;
  let teacherName = user.name;

  if (user.role === 'teacher') {
    const teacher = await Teacher.findOne({
      schoolId,
      $or: [{ _id: user.profileId }, { 'contact.email': user.email }],
    });

    if (!teacher) {
      throw new ApiError(403, 'No teacher profile linked to your account');
    }

    teacherId = teacher._id;
    teacherName = `${teacher.firstName} ${teacher.lastName}`;

    // Verify teacher is assigned to the class
    const isClassAssigned = (teacher.assignedClasses || []).some((c) => c.toString() === data.schoolClass.toString())
      || (teacher.classTeacherOf && teacher.classTeacherOf.toString() === data.schoolClass.toString());

    // Verify teacher is assigned to the subject
    const isSubjectAssigned = (teacher.subjects || []).some((s) => s.toString() === data.subject.toString());

    if (!isClassAssigned || !isSubjectAssigned) {
      throw new ApiError(403, 'You are not authorized to create homework for this class and subject combination');
    }
  } else if (user.role === 'school_admin' || user.role === 'super_admin') {
    if (data.teacher) {
      teacherId = data.teacher;
    } else {
      const firstTeacher = await Teacher.findOne({ schoolId, status: 'active' });
      teacherId = firstTeacher?._id || user.profileId || user._id;
    }
  } else {
    throw new ApiError(403, 'Only teachers and school administrators can create homework');
  }

  // 3. Validate Dates
  const assignedDate = data.assignedDate ? new Date(data.assignedDate) : new Date();
  const dueDate = new Date(data.dueDate);

  if (isNaN(dueDate.getTime())) {
    throw new ApiError(400, 'A valid due date is required');
  }

  if (dueDate < assignedDate) {
    throw new ApiError(400, 'Due date cannot be earlier than assigned date');
  }

  // 4. Handle File Attachments via Cloudinary/Local
  const attachments = [];

  if (files && files.length > 0) {
    for (const file of files) {
      try {
        const uploadResult = await uploadFileOnCloudinary(file.path, {
          folder: `instique/schools/${schoolId}/homework`,
          resource_type: 'auto',
        });

        if (uploadResult && (uploadResult.secure_url || uploadResult.url)) {
          attachments.push({
            name: file.originalname,
            url: uploadResult.secure_url || uploadResult.url,
            publicId: uploadResult.public_id,
            size: file.size || uploadResult.bytes,
            mimeType: file.mimetype || uploadResult.format,
          });
        }
      } catch (err) {
        console.error('Failed to upload homework attachment:', err);
      }
    }
  }

  // Also support pre-passed attachment JSON (e.g. template copy or existing files)
  if (data.attachments) {
    try {
      const existing = typeof data.attachments === 'string' ? JSON.parse(data.attachments) : data.attachments;
      if (Array.isArray(existing)) {
        existing.forEach((att) => {
          if (att.url && att.name) attachments.push(att);
        });
      }
    } catch {
      // ignore JSON parse error
    }
  }

  // 5. Create Database Record
  const status = data.status || 'published';

  const homework = await Homework.create({
    schoolId,
    academicYear: activeYear?._id,
    title: data.title.trim(),
    description: data.description ? data.description.trim() : '',
    subject: data.subject,
    schoolClass: data.schoolClass,
    section: data.section || null,
    teacher: teacherId,
    assignedDate,
    dueDate,
    status,
    attachments,
    isTemplate: data.isTemplate === true || data.isTemplate === 'true',
  });

  // 6. Notify Enrolled Students and Linked Parents if Published
  if (status === 'published') {
    try {
      notifyStudentsAndParents(schoolId, homework, teacherName);
    } catch (err) {
      console.error('Error dispatching homework notifications:', err);
    }
  }

  return await Homework.findById(homework._id)
    .populate('subject', 'name code')
    .populate('schoolClass', 'name')
    .populate('section', 'name')
    .populate('teacher', 'firstName lastName employeeId');
};

/**
 * Background helper to notify students and parents of new homework
 */
async function notifyStudentsAndParents(schoolId, homework, teacherName) {
  const studentQuery = {
    schoolId,
    currentClass: homework.schoolClass,
    status: 'active',
  };
  if (homework.section) {
    studentQuery.currentSection = homework.section;
  }

  const [students, subjectDoc, classDoc] = await Promise.all([
    Student.find(studentQuery).populate('parents').select('_id parents admissionNo firstName lastName currentClass currentSection'),
    Subject.findById(homework.subject).select('name'),
    SchoolClass.findById(homework.schoolClass).select('name'),
  ]);

  const studentUserIds = [];
  const parentUserIds = [];

  for (const s of students) {
    // Find Student User Account
    const sUser = await User.findOne({ schoolId, profileId: s._id, role: 'student' }).select('_id');
    if (sUser) studentUserIds.push(sUser._id);

    // Find Parent User Accounts
    if (Array.isArray(s.parents) && s.parents.length > 0) {
      const pIds = s.parents.map((p) => p._id || p);
      const pUsers = await User.find({ schoolId, profileId: { $in: pIds }, role: 'parent' }).select('_id');
      pUsers.forEach((pu) => parentUserIds.push(pu._id));
    }
  }

  const allRecipientIds = [...new Set([...studentUserIds, ...parentUserIds])];

  if (allRecipientIds.length > 0) {
    const formattedDue = new Date(homework.dueDate).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
    const subName = subjectDoc?.name || 'Subject';
    const clsName = classDoc?.name || 'Class';

    await sendBulkNotification(
      schoolId,
      allRecipientIds,
      `New Homework: ${subName}`,
      `Homework "${homework.title}" assigned for ${clsName} by ${teacherName}. Due date: ${formattedDue}.`,
      'homework'
    );
  }
}

/**
 * Get paginated homework records based on user role & filters
 */
export const getHomework = async (schoolId, user, options = {}) => {
  const query = { schoolId };

  // Class, Section, Subject, Status filters
  if (options.schoolClass) query.schoolClass = options.schoolClass;
  if (options.section) query.section = options.section;
  if (options.subject) query.subject = options.subject;
  if (options.status && options.status !== 'all') query.status = options.status;

  // Due date filter
  if (options.dueDate) {
    const d = new Date(options.dueDate);
    const start = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0);
    const end = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
    query.dueDate = { $gte: start, $lte: end };
  } else if (options.filter === 'upcoming') {
    query.dueDate = { $gte: new Date() };
    if (!options.status) query.status = 'published';
  } else if (options.filter === 'overdue') {
    query.dueDate = { $lt: new Date() };
    if (!options.status) query.status = 'published';
  }

  // Role-based scoping
  if (user.role === 'teacher') {
    const teacher = await Teacher.findOne({
      schoolId,
      $or: [{ _id: user.profileId }, { 'contact.email': user.email }],
    });
    if (teacher) {
      query.teacher = teacher._id;
    }
  } else if (user.role === 'student') {
    const student = await Student.findOne({
      schoolId,
      $or: [{ _id: user.profileId }, { 'contact.email': user.email }],
    });

    if (!student) {
      return { data: [], meta: { total: 0, page: 1, limit: options.limit || 10, totalPages: 0 } };
    }

    query.schoolClass = student.currentClass;
    if (student.currentSection) {
      query.$or = [{ section: student.currentSection }, { section: null }, { section: { $exists: false } }];
    }
    query.status = 'published';
  } else if (user.role === 'parent') {
    const parent = await Parent.findOne({
      schoolId,
      $or: [{ _id: user.profileId }, { 'contact.email': user.email }],
    }).populate('students');

    if (!parent || !parent.students || parent.students.length === 0) {
      return { data: [], meta: { total: 0, page: 1, limit: options.limit || 10, totalPages: 0 } };
    }

    if (options.studentId) {
      const matchedKid = parent.students.find((k) => k._id.toString() === options.studentId.toString());
      if (!matchedKid) {
        throw new ApiError(403, 'Unauthorized access to student homework');
      }
      query.schoolClass = matchedKid.currentClass;
      if (matchedKid.currentSection) {
        query.$or = [{ section: matchedKid.currentSection }, { section: null }, { section: { $exists: false } }];
      }
    } else {
      const kidClassIds = parent.students.map((k) => k.currentClass).filter(Boolean);
      query.schoolClass = { $in: kidClassIds };
    }

    query.status = 'published';
  }

  return paginate(Homework, query, {
    ...options,
    searchFields: ['title', 'description'],
    populate: [
      { path: 'subject', select: 'name code' },
      { path: 'schoolClass', select: 'name' },
      { path: 'section', select: 'name' },
      { path: 'teacher', select: 'firstName lastName employeeId' },
    ],
    sort: options.sort || '-createdAt',
  });
};

/**
 * Get homework by ID with full populate and access verification
 */
export const getHomeworkById = async (id, schoolId, user) => {
  const homework = await Homework.findOne({ _id: id, schoolId })
    .populate('subject', 'name code')
    .populate('schoolClass', 'name')
    .populate('section', 'name')
    .populate('teacher', 'firstName lastName employeeId')
    .populate('submissions.student', 'firstName lastName admissionNo rollNo');

  if (!homework) throw new ApiError(404, 'Homework not found');
  return homework;
};

/**
 * Update homework details, status, or attachments
 */
export const updateHomework = async (id, schoolId, user, data, files = []) => {
  const homework = await Homework.findOne({ _id: id, schoolId });
  if (!homework) throw new ApiError(404, 'Homework not found');

  // Verify authorization
  if (user.role === 'teacher') {
    const teacher = await Teacher.findOne({
      schoolId,
      $or: [{ _id: user.profileId }, { 'contact.email': user.email }],
    });
    if (!teacher || homework.teacher.toString() !== teacher._id.toString()) {
      throw new ApiError(403, 'You are only authorized to edit your own homework assignments');
    }
  }

  // Handle new file uploads
  const newAttachments = [...(homework.attachments || [])];

  if (files && files.length > 0) {
    for (const file of files) {
      try {
        const uploadResult = await uploadFileOnCloudinary(file.path, {
          folder: `instique/schools/${schoolId}/homework`,
          resource_type: 'auto',
        });

        if (uploadResult && (uploadResult.secure_url || uploadResult.url)) {
          newAttachments.push({
            name: file.originalname,
            url: uploadResult.secure_url || uploadResult.url,
            publicId: uploadResult.public_id,
            size: file.size || uploadResult.bytes,
            mimeType: file.mimetype || uploadResult.format,
          });
        }
      } catch (err) {
        console.error('Failed to upload updated attachment:', err);
      }
    }
  }

  // Apply updates
  if (data.title) homework.title = data.title.trim();
  if (data.description !== undefined) homework.description = data.description.trim();
  if (data.subject) homework.subject = data.subject;
  if (data.schoolClass) homework.schoolClass = data.schoolClass;
  if (data.section !== undefined) homework.section = data.section || null;
  if (data.dueDate) homework.dueDate = new Date(data.dueDate);
  if (data.assignedDate) homework.assignedDate = new Date(data.assignedDate);
  if (data.isTemplate !== undefined) homework.isTemplate = data.isTemplate === true || data.isTemplate === 'true';

  const wasDraft = homework.status === 'draft';
  if (data.status) homework.status = data.status;

  homework.attachments = newAttachments;
  await homework.save();

  // If transitioned from draft to published, dispatch notifications
  if (wasDraft && homework.status === 'published') {
    notifyStudentsAndParents(schoolId, homework, user.name);
  }

  return await Homework.findById(homework._id)
    .populate('subject', 'name code')
    .populate('schoolClass', 'name')
    .populate('section', 'name')
    .populate('teacher', 'firstName lastName');
};

/**
 * Publish a draft homework
 */
export const publishHomework = async (id, schoolId, user) => {
  return await updateHomework(id, schoolId, user, { status: 'published' });
};

/**
 * Cancel or delete homework
 */
export const cancelHomework = async (id, schoolId, user) => {
  return await updateHomework(id, schoolId, user, { status: 'cancelled' });
};

export const deleteHomework = async (id, schoolId, user) => {
  const homework = await Homework.findOne({ _id: id, schoolId });
  if (!homework) throw new ApiError(404, 'Homework not found');

  if (user.role === 'teacher') {
    const teacher = await Teacher.findOne({
      schoolId,
      $or: [{ _id: user.profileId }, { 'contact.email': user.email }],
    });
    if (!teacher || homework.teacher.toString() !== teacher._id.toString()) {
      throw new ApiError(403, 'You are only authorized to delete your own homework assignments');
    }
  }

  // Cleanup Cloudinary attachments
  if (homework.attachments && homework.attachments.length > 0) {
    for (const att of homework.attachments) {
      if (att.publicId) {
        try {
          await deleteFileFromCloudinary(att.publicId);
        } catch {
          // ignore
        }
      }
    }
  }

  await Homework.deleteOne({ _id: id, schoolId });
  return true;
};

/**
 * Submit homework assignment by student
 */
export const submitHomework = async (id, schoolId, user, data, files = []) => {
  const homework = await Homework.findOne({ _id: id, schoolId, status: 'published' });
  if (!homework) throw new ApiError(404, 'Published homework not found');

  const student = await Student.findOne({
    schoolId,
    $or: [{ _id: user.profileId }, { 'contact.email': user.email }],
  });

  if (!student) throw new ApiError(403, 'Student profile not found');

  const existingIdx = homework.submissions.findIndex((s) => s.student.toString() === student._id.toString());

  // Upload student submission attachments
  const submissionAttachments = [];
  if (files && files.length > 0) {
    for (const file of files) {
      try {
        const uploadResult = await uploadFileOnCloudinary(file.path, {
          folder: `instique/schools/${schoolId}/submissions/${id}`,
          resource_type: 'auto',
        });
        if (uploadResult?.secure_url || uploadResult?.url) {
          submissionAttachments.push({
            name: file.originalname,
            url: uploadResult.secure_url || uploadResult.url,
            publicId: uploadResult.public_id,
            size: file.size,
            mimeType: file.mimetype,
          });
        }
      } catch (err) {
        console.error('Submission file upload failed:', err);
      }
    }
  }

  const isLate = new Date() > new Date(homework.dueDate);

  if (existingIdx >= 0) {
    homework.submissions[existingIdx].submittedAt = new Date();
    homework.submissions[existingIdx].content = data.content || homework.submissions[existingIdx].content;
    if (submissionAttachments.length > 0) {
      homework.submissions[existingIdx].attachments.push(...submissionAttachments);
    }
    homework.submissions[existingIdx].status = isLate ? 'late' : 'resubmitted';
  } else {
    homework.submissions.push({
      student: student._id,
      submittedAt: new Date(),
      content: data.content || '',
      attachments: submissionAttachments,
      status: isLate ? 'late' : 'submitted',
    });
  }

  await homework.save();
  return homework;
};
