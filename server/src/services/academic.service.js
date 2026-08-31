import AcademicYear from '../models/AcademicYear.js';
import SchoolClass from '../models/SchoolClass.js';
import Section from '../models/Section.js';
import Subject from '../models/Subject.js';
import ApiError from '../utils/ApiError.js';
import { paginate } from '../utils/pagination.js';

export const createAcademicYear = async (schoolId, data) => {
  const existing = await AcademicYear.findOne({ schoolId, name: data.name });
  if (existing) throw new ApiError(409, 'Academic year with this name already exists');

  if (data.isCurrent) {
    await AcademicYear.updateMany({ schoolId, isCurrent: true }, { isCurrent: false });
  }

  const year = await AcademicYear.create({ ...data, schoolId });
  return year;
};

export const getAcademicYears = async (schoolId, options) => {
  return paginate(AcademicYear, { schoolId }, options);
};

export const updateAcademicYear = async (id, schoolId, data) => {
  if (data.isCurrent) {
    await AcademicYear.updateMany({ schoolId, isCurrent: true }, { isCurrent: false });
  }
  const year = await AcademicYear.findOneAndUpdate({ _id: id, schoolId }, data, { new: true });
  if (!year) throw new ApiError(404, 'Academic year not found');
  return year;
};

export const deleteAcademicYear = async (id, schoolId) => {
  const year = await AcademicYear.findOneAndDelete({ _id: id, schoolId });
  if (!year) throw new ApiError(404, 'Academic year not found');
  return true;
};

export const createClass = async (schoolId, data) => {
  const classData = { ...data };
  if (!classData.classTeacher) delete classData.classTeacher;

  const existing = await SchoolClass.findOne({ schoolId, name: classData.name, academicYear: classData.academicYear });
  if (existing) throw new ApiError(409, 'Class already exists for this academic year');

  const schoolClass = await SchoolClass.create({ ...classData, schoolId });
  if (data.subjects?.length) {
    await Subject.updateMany({ schoolId, _id: { $in: data.subjects } }, { $addToSet: { classes: schoolClass._id } });
  }
  return schoolClass;
};

export const getClasses = async (schoolId, options) => {
  const result = await paginate(SchoolClass, { schoolId }, { ...options, searchFields: ['name'] });
  return result;
};

export const getClassById = async (id, schoolId) => {
  const schoolClass = await SchoolClass.findOne({ _id: id, schoolId })
    .populate('classTeacher', 'firstName lastName')
    .populate('sections')
    .populate('subjects');
  if (!schoolClass) throw new ApiError(404, 'Class not found');
  return schoolClass;
};

export const updateClass = async (id, schoolId, data) => {
  const updateData = { ...data };
  if (!updateData.classTeacher) {
    delete updateData.classTeacher;
  }
  const schoolClass = await SchoolClass.findOneAndUpdate({ _id: id, schoolId }, updateData, { new: true });
  if (!schoolClass) throw new ApiError(404, 'Class not found');
  if (data.subjects) {
    await Subject.updateMany({ schoolId, classes: id }, { $pull: { classes: id } });
    await Subject.updateMany({ schoolId, _id: { $in: data.subjects } }, { $addToSet: { classes: id } });
  }
  return schoolClass;
};

export const deleteClass = async (id, schoolId) => {
  const schoolClass = await SchoolClass.findOneAndDelete({ _id: id, schoolId });
  if (!schoolClass) throw new ApiError(404, 'Class not found');
  await Section.deleteMany({ schoolClass: id, schoolId });
  return true;
};

export const createSection = async (schoolId, data) => {
  const existing = await Section.findOne({ schoolId, schoolClass: data.schoolClass, name: data.name });
  if (existing) throw new ApiError(409, 'Section already exists in this class');

  const section = await Section.create({ ...data, schoolId });
  await SchoolClass.findByIdAndUpdate(data.schoolClass, { $push: { sections: section._id } });
  return section;
};

export const getSections = async (schoolId, options) => {
  return paginate(Section, { schoolId }, options);
};

export const getSectionsByClass = async (classId, schoolId) => {
  return Section.find({ schoolClass: classId, schoolId });
};

export const updateSection = async (id, schoolId, data) => {
  const section = await Section.findOneAndUpdate({ _id: id, schoolId }, data, { new: true });
  if (!section) throw new ApiError(404, 'Section not found');
  return section;
};

export const deleteSection = async (id, schoolId) => {
  const section = await Section.findOneAndDelete({ _id: id, schoolId });
  if (!section) throw new ApiError(404, 'Section not found');
  await SchoolClass.findByIdAndUpdate(section.schoolClass, { $pull: { sections: id } });
  return true;
};

export const createSubject = async (schoolId, data) => {
  const existing = await Subject.findOne({ schoolId, code: data.code });
  if (existing) throw new ApiError(409, 'Subject code already exists');

  const subject = await Subject.create({ ...data, schoolId });
  if (data.classes?.length) {
    await SchoolClass.updateMany({ _id: { $in: data.classes } }, { $addToSet: { subjects: subject._id } });
  }
  return subject;
};

export const getSubjects = async (schoolId, options = {}) => {
  const query = { schoolId };
  const targetClassId = options.schoolClass || options.classId;
  if (targetClassId) {
    const schoolClassObj = await SchoolClass.findById(targetClassId).select('subjects');
    const classSubjectIds = schoolClassObj?.subjects || [];
    query.$or = [
      { classes: targetClassId },
      { _id: { $in: classSubjectIds } },
    ];
  }
  return paginate(Subject, query, { ...options, searchFields: ['name', 'code'] });
};

export const updateSubject = async (id, schoolId, data) => {
  const subject = await Subject.findOneAndUpdate({ _id: id, schoolId }, data, { new: true });
  if (!subject) throw new ApiError(404, 'Subject not found');
  if (data.classes) {
    await SchoolClass.updateMany({ schoolId, subjects: id }, { $pull: { subjects: id } });
    await SchoolClass.updateMany({ schoolId, _id: { $in: data.classes } }, { $addToSet: { subjects: id } });
  }
  return subject;
};

export const deleteSubject = async (id, schoolId) => {
  const subject = await Subject.findOneAndDelete({ _id: id, schoolId });
  if (!subject) throw new ApiError(404, 'Subject not found');
  await SchoolClass.updateMany({ subjects: id }, { $pull: { subjects: id } });
  return true;
};

export const bulkEditSubjects = async (schoolId, { field, value, subjectIds }) => {
  const allowedFields = ['maxMarks', 'passMarks', 'weeklyPeriods', 'type'];
  if (!allowedFields.includes(field)) {
    throw new ApiError(400, `Field "${field}" is not allowed for bulk editing.`);
  }

  let parsedValue = value;
  if (['maxMarks', 'passMarks', 'weeklyPeriods'].includes(field)) {
    parsedValue = Number(value);
    if (isNaN(parsedValue)) {
      throw new ApiError(400, `Value for "${field}" must be a number.`);
    }
  }

  const query = { schoolId };
  if (Array.isArray(subjectIds) && subjectIds.length > 0) {
    query._id = { $in: subjectIds };
  }

  const result = await Subject.updateMany(query, { $set: { [field]: parsedValue } });
  return result;
};

