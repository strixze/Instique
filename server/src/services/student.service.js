import Student from '../models/Student.js';
import Section from '../models/Section.js';
import ApiError from '../utils/ApiError.js';
import { paginate } from '../utils/pagination.js';

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
  });
  return student;
};

export const getStudents = async (schoolId, options) => {
  return paginate(Student, { schoolId }, { ...options, searchFields: ['firstName', 'lastName', 'admissionNo'] });
};

export const getStudentById = async (id, schoolId) => {
  const student = await Student.findOne({ _id: id, schoolId })
    .populate('currentClass', 'name')
    .populate('currentSection', 'name')
    .populate('parents', 'firstName lastName contact')
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
