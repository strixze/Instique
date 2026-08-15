import Exam from '../models/Exam.js';
import Mark from '../models/Mark.js';
import ApiError from '../utils/ApiError.js';
import { paginate } from '../utils/pagination.js';

export const createExam = async (schoolId, data) => {
  const exam = await Exam.create({ ...data, schoolId });
  return exam;
};

export const getExams = async (schoolId, options) => {
  return paginate(Exam, { schoolId }, { ...options, searchFields: ['name'] });
};

export const getExamById = async (id, schoolId) => {
  const exam = await Exam.findOne({ _id: id, schoolId })
    .populate('schoolClass', 'name')
    .populate('academicYear', 'name')
    .populate('subjects.subject', 'name code');
  if (!exam) throw new ApiError(404, 'Exam not found');
  return exam;
};

export const updateExam = async (id, schoolId, data) => {
  const exam = await Exam.findOneAndUpdate({ _id: id, schoolId }, data, { new: true });
  if (!exam) throw new ApiError(404, 'Exam not found');
  return exam;
};

export const deleteExam = async (id, schoolId) => {
  const exam = await Exam.findOneAndDelete({ _id: id, schoolId });
  if (!exam) throw new ApiError(404, 'Exam not found');
  await Mark.deleteMany({ exam: id, schoolId });
  return true;
};

export const enterMark = async (schoolId, data, userId) => {
  const exam = await Exam.findById(data.exam);
  if (!exam) throw new ApiError(404, 'Exam not found');

  const subjectConfig = exam.subjects.find((s) => s.subject.toString() === data.subject);
  if (!subjectConfig) throw new ApiError(400, 'Subject not part of this exam');

  const existing = await Mark.findOne({ schoolId, exam: data.exam, subject: data.subject, student: data.student });
  if (existing) throw new ApiError(409, 'Marks already entered for this student/subject');

  const percentage = (data.marksObtained / subjectConfig.maxMarks) * 100;
  let grade = 'F';
  if (percentage >= 90) grade = 'A+';
  else if (percentage >= 80) grade = 'A';
  else if (percentage >= 70) grade = 'B+';
  else if (percentage >= 60) grade = 'B';
  else if (percentage >= 50) grade = 'C';
  else if (percentage >= 40) grade = 'D';

  const mark = await Mark.create({
    ...data,
    schoolId,
    maxMarks: subjectConfig.maxMarks,
    passMarks: subjectConfig.passMarks,
    grade,
    percentage: Math.round(percentage * 100) / 100,
    enteredBy: userId,
  });

  return mark;
};

export const getMarks = async (schoolId, options) => {
  return paginate(Mark, { schoolId }, options);
};

export const getMarksByExam = async (schoolId, examId) => {
  const marks = await Mark.find({ schoolId, exam: examId })
    .populate('student', 'firstName lastName admissionNo')
    .populate('subject', 'name code');
  return marks;
};

export const publishResults = async (schoolId, examId) => {
  const exam = await Exam.findOneAndUpdate({ _id: examId, schoolId }, { status: 'published' }, { new: true });
  if (!exam) throw new ApiError(404, 'Exam not found');
  return exam;
};
