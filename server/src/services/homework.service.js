import Homework from '../models/Homework.js';
import ApiError from '../utils/ApiError.js';
import { paginate } from '../utils/pagination.js';

export const createHomework = async (schoolId, data, teacherId) => {
  const homework = await Homework.create({ ...data, schoolId, teacher: teacherId });
  return homework;
};

export const getHomework = async (schoolId, options) => {
  return paginate(Homework, { schoolId }, { ...options, searchFields: ['title'] });
};

export const getHomeworkById = async (id, schoolId) => {
  const homework = await Homework.findOne({ _id: id, schoolId })
    .populate('subject', 'name')
    .populate('schoolClass', 'name')
    .populate('teacher', 'firstName lastName');
  if (!homework) throw new ApiError(404, 'Homework not found');
  return homework;
};

export const updateHomework = async (id, schoolId, data) => {
  const homework = await Homework.findOneAndUpdate({ _id: id, schoolId }, data, { new: true });
  if (!homework) throw new ApiError(404, 'Homework not found');
  return homework;
};

export const deleteHomework = async (id, schoolId) => {
  const homework = await Homework.findOneAndDelete({ _id: id, schoolId });
  if (!homework) throw new ApiError(404, 'Homework not found');
  return true;
};

export const submitHomework = async (id, schoolId, studentId, data) => {
  const homework = await Homework.findOne({ _id: id, schoolId });
  if (!homework) throw new ApiError(404, 'Homework not found');

  const existing = homework.submissions.find((s) => s.student.toString() === studentId.toString());
  if (existing) throw new ApiError(409, 'Already submitted');

  homework.submissions.push({
    student: studentId,
    submittedAt: new Date(),
    content: data.content,
    status: new Date() > homework.dueDate ? 'late' : 'submitted',
  });

  await homework.save();
  return homework;
};
