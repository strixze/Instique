// src/services/authorization.service.js
import ApiError from '../utils/ApiError.js';
import { getParentForUser } from './parent.service.js';
import Teacher from '../models/Teacher.js';
import SchoolClass from '../models/SchoolClass.js';
import Timetable from '../models/Timetable.js';
import Substitution from '../models/Substitution.js';
import Student from '../models/Student.js';

/**
 * Verify that a parent user has access to a specific student.
 * Throws ApiError(403) if not authorized.
 *
 * @param {Object} user - Authenticated user object (req.user)
 * @param {String} schoolId - Current tenant school ID (req.schoolId)
 * @param {String|ObjectId} studentId - Target student ID
 */
export const verifyParentAccessToStudent = async (user, schoolId, studentId) => {
  if (!user) {
    throw new ApiError(401, 'Authentication required');
  }
  // Super admin bypasses checks
  if (user.role === 'super_admin') return;

  // Only parents need this check; others are handled by existing RBAC
  if (user.role !== 'parent') return;

  const parent = await getParentForUser(user, schoolId);
  // parent.students is an array of ObjectId refs
  const isLinked = parent.students.some(
    (id) => id.toString() === studentId.toString()
  );
  if (!isLinked) {
    // Do not reveal existence of the student in other schools
    throw new ApiError(403, 'Access denied: Student not linked to your account');
  }
};

export const getTeacherForUser = async (user, schoolId) => {
  if (!user) throw new ApiError(401, 'Authentication required');
  if (user.role !== 'teacher') return null;

  let teacher = null;
  if (user.profileId) {
    teacher = await Teacher.findOne({ _id: user.profileId, schoolId });
  }
  if (!teacher && user.email) {
    teacher = await Teacher.findOne({ schoolId, 'contact.email': user.email.toLowerCase().trim() });
  }
  if (!teacher) {
    throw new ApiError(403, 'Teacher profile not found for user');
  }
  return teacher;
};

export const getTeacherScope = async (user, schoolId) => {
  const teacher = await getTeacherForUser(user, schoolId);
  if (!teacher) return null;

  const classIds = new Set();
  const sectionIds = new Set();
  const subjectIds = new Set();

  (teacher.assignedClasses || []).forEach((c) => classIds.add(c.toString()));
  if (teacher.classTeacherOf) classIds.add(teacher.classTeacherOf.toString());

  const classesAsTeacher = await SchoolClass.find({ schoolId, classTeacher: teacher._id }).select('_id');
  classesAsTeacher.forEach((c) => classIds.add(c._id.toString()));

  (teacher.assignedSections || []).forEach((s) => sectionIds.add(s.toString()));
  if (teacher.classTeacherSection) sectionIds.add(teacher.classTeacherSection.toString());

  (teacher.subjects || []).forEach((s) => subjectIds.add(s.toString()));

  const timetableEntries = await Timetable.find({
    schoolId,
    'periods.teacher': teacher._id,
  }).select('schoolClass section periods');

  timetableEntries.forEach((tt) => {
    if (tt.schoolClass) classIds.add(tt.schoolClass.toString());
    if (tt.section) sectionIds.add(tt.section.toString());
    (tt.periods || []).forEach((p) => {
      if (p.teacher && p.teacher.toString() === teacher._id.toString() && p.subject) {
        subjectIds.add(p.subject.toString());
      }
    });
  });

  const substitutionEntries = await Substitution.find({
    schoolId,
    $or: [{ substituteTeacher: teacher._id }, { originalTeacher: teacher._id }],
    status: { $ne: 'cancelled' },
  }).select('schoolClass section subject');

  substitutionEntries.forEach((sub) => {
    if (sub.schoolClass) classIds.add(sub.schoolClass.toString());
    if (sub.section) sectionIds.add(sub.section.toString());
    if (sub.subject) subjectIds.add(sub.subject.toString());
  });

  return {
    teacherId: teacher._id.toString(),
    classIds: Array.from(classIds),
    sectionIds: Array.from(sectionIds),
    subjectIds: Array.from(subjectIds),
  };
};

export const verifyTeacherClassAccess = async (user, schoolId, classId) => {
  if (!user) throw new ApiError(401, 'Authentication required');
  if (['super_admin', 'school_admin'].includes(user.role)) return;
  if (user.role !== 'teacher') return;

  const scope = await getTeacherScope(user, schoolId);
  if (!scope) return;

  if (!scope.classIds.includes(classId.toString())) {
    throw new ApiError(403, 'Access denied: You are not authorized for this class');
  }
};

export const verifyTeacherSectionAccess = async (user, schoolId, classId, sectionId) => {
  if (!user) throw new ApiError(401, 'Authentication required');
  if (['super_admin', 'school_admin'].includes(user.role)) return;
  if (user.role !== 'teacher') return;

  const scope = await getTeacherScope(user, schoolId);
  if (!scope) return;

  if (!scope.classIds.includes(classId.toString())) {
    throw new ApiError(403, 'Access denied: You are not authorized for this class');
  }

  if (sectionId) {
    const teacher = await getTeacherForUser(user, schoolId);
    if (teacher.assignedSections && teacher.assignedSections.length > 0) {
      if (!scope.sectionIds.includes(sectionId.toString())) {
        throw new ApiError(403, 'Access denied: You are not authorized for this section');
      }
    }
  }
};

export const verifyTeacherSubjectAccess = async (user, schoolId, classId, subjectId) => {
  if (!user) throw new ApiError(401, 'Authentication required');
  if (['super_admin', 'school_admin'].includes(user.role)) return;
  if (user.role !== 'teacher') return;

  const scope = await getTeacherScope(user, schoolId);
  if (!scope) return;

  if (classId && !scope.classIds.includes(classId.toString())) {
    throw new ApiError(403, 'Access denied: You are not authorized for this class');
  }

  if (!scope.subjectIds.includes(subjectId.toString())) {
    throw new ApiError(403, 'Access denied: You are not authorized for this subject');
  }
};

export const verifyTeacherStudentAccess = async (user, schoolId, studentId) => {
  if (!user) throw new ApiError(401, 'Authentication required');
  if (['super_admin', 'school_admin'].includes(user.role)) return;
  if (user.role !== 'teacher') return;

  const student = await Student.findOne({ _id: studentId, schoolId }).select('currentClass currentSection');
  if (!student) {
    throw new ApiError(404, 'Student not found');
  }

  if (student.currentClass) {
    await verifyTeacherSectionAccess(user, schoolId, student.currentClass, student.currentSection);
  } else {
    throw new ApiError(403, 'Access denied: Student does not belong to an active class');
  }
};
