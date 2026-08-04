import Syllabus from '../models/Syllabus.js';
import ApiError from '../utils/ApiError.js';
import { paginate } from '../utils/pagination.js';

export const createSyllabus = async (schoolId, data) => {
  const existing = await Syllabus.findOne({ schoolId, subject: data.subject, schoolClass: data.schoolClass, academicYear: data.academicYear });
  if (existing) throw new ApiError(409, 'Syllabus already exists for this subject/class');

  const syllabus = await Syllabus.create({ ...data, schoolId });
  return syllabus;
};

export const getSyllabus = async (schoolId, options) => {
  return paginate(Syllabus, { schoolId }, options);
};

export const getSyllabusById = async (id, schoolId) => {
  const syllabus = await Syllabus.findOne({ _id: id, schoolId })
    .populate('subject', 'name code')
    .populate('schoolClass', 'name');
  if (!syllabus) throw new ApiError(404, 'Syllabus not found');
  return syllabus;
};

export const updateProgress = async (id, schoolId, chapterIndex, completedClasses) => {
  const syllabus = await Syllabus.findOne({ _id: id, schoolId });
  if (!syllabus) throw new ApiError(404, 'Syllabus not found');

  if (!syllabus.chapters[chapterIndex]) throw new ApiError(400, 'Invalid chapter index');

  syllabus.chapters[chapterIndex].completedClasses = completedClasses;
  if (completedClasses >= syllabus.chapters[chapterIndex].totalClasses) {
    syllabus.chapters[chapterIndex].status = 'completed';
  } else if (completedClasses > 0) {
    syllabus.chapters[chapterIndex].status = 'in_progress';
  }

  const total = syllabus.chapters.reduce((s, c) => s + c.totalClasses, 0);
  const completed = syllabus.chapters.reduce((s, c) => s + c.completedClasses, 0);
  syllabus.totalCompletion = total > 0 ? Math.round((completed / total) * 100) : 0;

  await syllabus.save();
  return syllabus;
};

export const deleteSyllabus = async (id, schoolId) => {
  const syllabus = await Syllabus.findOneAndDelete({ _id: id, schoolId });
  if (!syllabus) throw new ApiError(404, 'Syllabus not found');
  return true;
};
